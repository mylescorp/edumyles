/** Themed empty state for when no data is available */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const ActionTag = actionHref ? "a" : "button";

  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && (
        <ActionTag
          href={actionHref}
          onClick={onAction}
          className="btn-cta mt-5 text-xs"
        >
          {actionLabel}
        </ActionTag>
      )}
    </div>
  );
}
