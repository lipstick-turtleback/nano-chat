/**
 * Loading skeleton shown while waiting for the first AI response
 */
function LoadingSkeleton() {
  return (
    <div className="message-wrapper assistant">
      <div className="skeleton-bubble">
        <div className="skeleton-line skeleton-line-1" />
        <div className="skeleton-line skeleton-line-2" />
        <div className="skeleton-line skeleton-line-3" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
