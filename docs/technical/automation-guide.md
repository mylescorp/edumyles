# Automation Guide

This guide covers the automation systems implemented for the EduMyles project.

## Overview

The project includes comprehensive automation for:
- Project board management
- Progress tracking
- Documentation updates
- Issue generation
- External integrations

## Core Automation Scripts

### Project Board Automation
- `scripts/project-board-automation.js` - Board management
- `scripts/pr-automation.js` - PR-based updates
- `scripts/progress-tracker.js` - Progress monitoring

### Issue Generation
- `scripts/generate-issues.js` - Create issues from plans
- `scripts/create-implementation-issues.js` - Implementation tasks

### Advanced Analytics
- `scripts/advanced-automation.js` - Comprehensive analysis
- `scripts/integrations.js` - External service integrations

## GitHub Actions Workflows

### Core Workflows
- `pr-automation.yml` - Automatic board updates from PRs
- `project-automation.yml` - Project management automation
- `ci.yml` - Continuous integration
- `advanced-automation.yml` - Advanced analytics

### Triggers
- Pull request creation/updates
- Issue creation/closure
- Scheduled runs (daily/weekly)
- Manual dispatch

## Usage

### Manual Execution
```bash
# Update project board
npm run automation:board:report

# Generate progress report
npm run automation:progress:report

# Full analysis
node scripts/advanced-automation.js full-analysis
```

### GitHub CLI
```bash
# Trigger workflow
gh workflow run advanced-automation.yml --field action=full-analysis

# View project board
gh project view 6 --owner Mylesoft-Technologies --web
```

## Configuration

### Required Secrets
- `GITHUB_TOKEN` - GitHub API access
- `WORKOS_API_KEY` - WorkOS integration (optional)
- `SLACK_WEBHOOK_URL` - Slack notifications (optional)

### Environment Variables
- `REPO` - Repository name
- `PROJECT_NUMBER` - Project board ID
- `OWNER` - Organization name

## Features

### Automatic Board Updates
- Issues move between columns based on PR status
- Progress comments added automatically
- Labels applied based on file changes

### Progress Tracking
- Real-time status updates
- Weekly progress reports
- Phase completion tracking
- Team performance metrics

### External Integrations
- Slack notifications
- Email reports
- Calendar sync
- Dashboard updates

## Troubleshooting

### Common Issues
1. **Permission Errors** - Check GitHub token permissions
2. **Rate Limiting** - Monitor API usage limits
3. **Failed Workflows** - Review GitHub Actions logs
4. **Missing Secrets** - Verify environment variables

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=automation
```

## Maintenance

- Review automation logs weekly
- Update scripts as project evolves
- Monitor API quota usage
- Backup project board data regularly
