import { getLinearClient } from '../../core/client';
import { displaySuccess, handleError } from '../../utils/errors';
import pc from 'picocolors';

interface CreateOptions {
  title: string;
  team: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  labels?: string[];
  estimate?: string;
  parent?: string;
}

interface IssueInput {
  title: string;
  teamId: string;
  description?: string;
  stateId?: string;
  assigneeId?: string;
  priority?: number;
  labelIds?: string[];
  estimate?: number;
  parentId?: string;
}

export async function createIssue(options: CreateOptions): Promise<void> {
  try {
    const client = getLinearClient();

    const teamId = await findTeamIdByName(options.team);
    if (!teamId) {
      throw new Error(`Team "${options.team}" not found`);
    }

    const createInput: IssueInput = {
      title: options.title,
      teamId: teamId,
    };

    if (options.description !== undefined) {
      createInput.description = options.description;
    }

    if (options.status !== undefined) {
      const stateId = await findStateIdByName(options.status, teamId);
      if (!stateId) {
        throw new Error(`Status "${options.status}" not found`);
      }
      createInput.stateId = stateId;
    }

    if (options.assignee !== undefined) {
      const assigneeId = await findUserIdByEmail(options.assignee);
      if (!assigneeId) {
        throw new Error(`User "${options.assignee}" not found`);
      }
      createInput.assigneeId = assigneeId;
    }

    if (options.priority !== undefined) {
      const priority = parseInt(options.priority, 10);
      if (isNaN(priority) || priority < 0 || priority > 4) {
        throw new Error('Priority must be a number between 0 (None) and 4 (Low)');
      }
      createInput.priority = priority;
    }

    if (options.labels !== undefined && options.labels.length > 0) {
      const labelIds = await findLabelIdsByNames(options.labels, teamId);
      if (labelIds.length === 0) {
        throw new Error('No matching labels found');
      }
      createInput.labelIds = labelIds;
    }

    if (options.estimate !== undefined) {
      const estimate = parseFloat(options.estimate);
      if (isNaN(estimate)) {
        throw new Error('Estimate must be a valid number');
      }
      createInput.estimate = estimate;
    }

    if (options.parent !== undefined) {
      const parentIssue = await client.issue(options.parent);
      if (!parentIssue) {
        throw new Error(`Parent issue "${options.parent}" not found`);
      }
      createInput.parentId = parentIssue.id;
    }

    const result = await client.createIssue(createInput);

    if (!result.success) {
      throw new Error('Failed to create issue');
    }

    const createdIssue = await result.issue;
    if (createdIssue) {
      displaySuccess(`Issue ${createdIssue.identifier} created successfully`);
      console.log(pc.cyan(createdIssue.url));
    } else {
      displaySuccess('Issue created successfully');
    }
  } catch (error) {
    handleError(error);
  }
}

async function findTeamIdByName(teamName: string): Promise<string | null> {
  const client = getLinearClient();
  const teams = await client.teams({
    filter: {
      name: { eq: teamName }
    }
  });

  return teams.nodes.length > 0 ? teams.nodes[0].id : null;
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
