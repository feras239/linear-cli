import { getLinearClient } from '../../core/client';
import { displayTable } from '../../utils/display';
import { handleError } from '../../utils/errors';

export async function listTeams(): Promise<void> {
  try {
    const client = getLinearClient();
    const teams = await client.teams();

    if (teams.nodes.length === 0) {
      console.log('No teams found');
      return;
    }

    const rows = teams.nodes.map(team => [
      team.key,
      team.name,
      team.description || '-',
    ]);

    displayTable(
      [
        { header: 'Key', width: 10 },
        { header: 'Name', width: 30 },
        { header: 'Description', width: 50 },
      ],
      rows
    );
  } catch (error) {
    handleError(error);
  }
}
