#!/usr/bin/env node

import { Command } from 'commander';
import { login } from './commands/auth/login';
import { listIssues } from './commands/issue/list';
import { viewIssue } from './commands/issue/view';
import { handleComments } from './commands/issue/comment';
import { updateIssue } from './commands/issue/update';

const program = new Command();

program
  .name('linear')
  .description('Command-line interface for Linear')
  .version('0.1.0');

const auth = program.command('auth').description('Manage authentication');

auth
  .command('login')
  .description('Authenticate with Linear API')
  .action(login);

const issue = program.command('issue').description('Manage issues');

issue
  .command('list')
  .description('List issues')
  .option('--status <status...>', 'Filter by status (supports "!Status" for exclusion)')
  .option('--assignee <email...>', 'Filter by assignee email (supports "!email" for exclusion)')
  .option('--label <label...>', 'Filter by label (supports "!label" for exclusion)')
  .option('--exclude-status <status...>', 'Exclude issues with these statuses')
  .option('--exclude-assignee <email...>', 'Exclude issues assigned to these users')
  .option('--exclude-label <label...>', 'Exclude issues with these labels')
  .option('--sort <field>', 'Sort by: updated, created, priority, title (default: updated)')
  .option('--order <order>', 'Sort order: asc, desc (default: desc)')
  .option('--limit <number>', 'Limit number of results', '50')
  .action(listIssues);

issue
  .command('view <issue-id>')
  .description('View issue details')
  .action(viewIssue);

issue
  .command('update <issue-id>')
  .description('Update an issue')
  .option('--title <title>', 'Update issue title')
  .option('--description <description>', 'Update issue description')
  .option('--status <status>', 'Update issue status (by status name)')
  .option('--assignee <email>', 'Update issue assignee (by email)')
  .option('--priority <priority>', 'Update issue priority (0-4: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)')
  .option('--labels <labels...>', 'Update issue labels (by label names)')
  .option('--estimate <estimate>', 'Update issue estimate (story points)')
  .action(updateIssue);

const comment = issue.command('comment').description('Manage issue comments');

comment
  .command('list <issue-id>')
  .description('List comments on an issue')
  .action(handleComments);

comment
  .command('create <issue-id>')
  .description('Create a comment on an issue')
  .requiredOption('--body <text>', 'Comment body')
  .action((issueId, options) => handleComments(issueId, { add: options.body }));

program.parse();
