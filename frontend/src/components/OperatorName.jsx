import React from 'react';

const OperatorName = ({ username }) => {
  const fullName = `@${username}`;
  const isTruncated = username.length > 7;
  const visibleName = isTruncated ? `@${username.slice(0, 7)}...` : fullName;

  return (
    <span
      className={isTruncated ? 'operator-name is-truncated' : 'operator-name'}
      tabIndex={isTruncated ? 0 : undefined}
      role={isTruncated ? 'group' : undefined}
      aria-label={isTruncated ? `Tài khoản ${fullName}` : undefined}
    >
      <span className="operator-name-text" aria-hidden="true">{visibleName}</span>
      {isTruncated && (
        <span className="operator-name-tooltip" aria-hidden="true">{fullName}</span>
      )}
    </span>
  );
};

export default OperatorName;
