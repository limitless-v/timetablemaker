function StatCard({ title, value, icon, variant }) {
  return (
    <div className="card stat-card shadow-sm border-0">
      <div className="card-body d-flex align-items-center justify-content-between">
        <div>
          <h6 className="text-muted mb-2">{title}</h6>
          <h3 className="mb-0 text-dark">{value}</h3>
        </div>
        <div className={`stat-icon text-white bg-${variant} rounded-circle d-flex align-items-center justify-content-center`} style={{ width: 48, height: 48 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
