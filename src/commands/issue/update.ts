import { getLinearClient } from '../../core/client';
import { displaySuccess, handleError } from '../../utils/errors';

interface UpdateOptions {
  title?: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  labels?: string[];
  estimate?: string;
}

export async function updateIssue(issueId: string, options: UpdateOptions): Promise<void> {
  try {
    const client = getLinearClient();
    const issue = await client.issue(issueId);

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const team = await issue.team;
    const teamId = team?.id;

    if (!teamId) {
      throw new Error('Issue team not found');
    }

    const updateInput: Record<string, unknown> = {};

    if (options.title !== undefined) {
      updateInput.title = options.title;
    }

    if (options.description !== undefined) {
      updateInput.description = options.description;
    }

    if (options.status !== undefined) {
      const stateId = await findStateIdByName(options.status, teamId);
      if (!stateId) {
        throw new Error(`Status "${options.status}" not found`);
      }
      updateInput.stateId = stateId;
    }

    if (options.assignee !== undefined) {
      const assigneeId = await findUserIdByEmail(options.assignee);
      if (!assigneeId) {
        throw new Error(`User "${options.assignee}" not found`);
      }
      updateInput.assigneeId = assigneeId;
    }

    if (options.priority !== undefined) {
      const priority = parseInt(options.priority, 10);
      if (isNaN(priority) || priority < 0 || priority > 4) {
        throw new Error('Priority must be a number between 0 (None) and 4 (Low)');
      }
      updateInput.priority = priority;
    }

    if (options.labels !== undefined && options.labels.length > 0) {
      const labelIds = await findLabelIdsByNames(options.labels, teamId);
      if (labelIds.length === 0) {
        throw new Error('No matching labels found');
      }
      updateInput.labelIds = labelIds;
    }

    if (options.estimate !== undefined) {
      const estimate = parseFloat(options.estimate);
      if (isNaN(estimate)) {
        throw new Error('Estimate must be a valid number');
      }
      updateInput.estimate = estimate;
    }

    if (Object.keys(updateInput).length === 0) {
      throw new Error('No update options provided');
    }

    const result = await client.updateIssue(issue.id, updateInput);

    if (!result.success) {
      throw new Error('Failed to update issue');
    }

    displaySuccess(`Issue ${issue.identifier} updated successfully`);
  } catch (error) {
    handleError(error);
  }
}

async function findStateIdByName(stateName: string, teamId: string): Promise<string | null> {
  const client = getLinearClient();
  const states = await client.workflowStates({
    filter: {
      team: { id: { eq: teamId } },
      name: { eq: stateName }
    }
  });

  return states.nodes.length > 0 ? states.nodes[0].id : null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const client = getLinearClient();
  const users = await client.users({
    filter: {
      email: { eq: email }
    }
  });

  return users.nodes.length > 0 ? users.nodes[0].id : null;
}

async function findLabelIdsByNames(labelNames: string[], teamId: string): Promise<string[]> {
  const client = getLinearClient();
  const labels = await client.issueLabels({
    filter: {
      team: { id: { eq: teamId } },
      name: { in: labelNames }
    }
  });

  return labels.nodes.map(label => label.id);
}
