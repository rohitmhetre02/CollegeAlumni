import React from 'react';

const Icon = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#606770" xmlns="http://www.w3.org/2000/svg">
    <path d={path} />
  </svg>
);

const checkPath = 'M20.285 6.709l-12.62 12.621-5.64-5.642 1.414-1.414 4.224 4.223 11.205-11.206z';

const icons = {
  map: 'M12 2l7 4v12l-7 4-7-4V6l7-4zm0 2.18L7 6.5v9l5 2.86 5-2.86v-9L12 4.18z M12 8a3 3 0 110 6 3 3 0 010-6z',
  phone: 'M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.4 22 2 13.6 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z',
  mail: 'M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0l8 5 8-5H4zm16 12V8l-8 5-8-5v10h16z',
  gender: 'M19 6h-3V3h-2v3h-3v2h3v3h2V8h3V6zM9 11a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z',
  cake: 'M12 2a2 2 0 00-2 2v2H8a4 4 0 00-4 4v8a2 2 0 002 2h12a2 2 0 002-2v-8a4 4 0 00-4-4h-2V4a2 2 0 00-2-2zm0 6h4a2 2 0 012 2v2H6V10a2 2 0 012-2h4zm6 6v4H6v-4h12z',
  pen: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 000-1.42l-2.5-2.5a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z',
};

const ProfileTopCard = ({
  name,
  degree = 'B.E.',
  college = '',
  location = '-',
  gender = '-',
  birthDate = '-',
  phone = '-',
  email = '-',
  progress = 100,
  imageUrl,
  onEdit,
  profession = '',
  company = '',
  headline = '',
  roleLabel = '',
  department = '',
  facultyId = '',
  workExperience = '',
}) => {
  const circumference = 2 * Math.PI * 54;
  const dashoffset = circumference * (1 - progress / 100);
  const experienceText = (() => {
    if (workExperience === null || workExperience === undefined || workExperience === '') return '';
    if (typeof workExperience === 'object') {
      const numeric = workExperience.value ?? workExperience.amount ?? workExperience.years ?? workExperience.total ?? '';
      if (numeric === '' || numeric === null || numeric === undefined) return '';
      const unit = workExperience.unit || workExperience.units || workExperience.label || 'yrs';
      return `${numeric} ${unit}`.trim();
    }
    return workExperience;
  })();
  return (
    <div style={styles.card}>
      <div style={styles.profileImageWrapper}>
        <img src={imageUrl} alt={name} style={styles.profileImage} />
        <svg style={styles.progressCircleSvg} viewBox="0 0 120 120">
          <circle stroke="#e0e0e0" strokeWidth="8" fill="transparent" r="54" cx="60" cy="60" />
          <circle stroke="#42b72a" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" fill="transparent" r="54" cx="60" cy="60" />
          <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="700" fill="#42b72a" fontFamily="Arial, sans-serif">{progress}%</text>
        </svg>
      </div>
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{name}</h2>
          <button onClick={onEdit} style={styles.iconBtn} aria-label="Edit">
            <Icon path={icons.pen} size={16} />
          </button>
        </div>
        {headline && (
          <p style={styles.headline}>
            {headline}
          </p>
        )}
        {profession && (
          <p style={styles.profession}>
            {profession}{company && ` at ${company}`}
          </p>
        )}
        <p style={styles.degree}>{degree}</p>
        {college && <p style={styles.college}>{college}</p>}
        <div style={styles.divider} />
        {(roleLabel || department || facultyId || experienceText) && (
          <div style={styles.metadataRow}>
            {roleLabel && <span style={styles.metadataPill}>Role: {roleLabel}</span>}
            {department && <span style={styles.metadataPill}>Department: {department}</span>}
            {facultyId && <span style={styles.metadataPill}>Faculty ID: {facultyId}</span>}
            {experienceText && (
              <span style={styles.metadataPill}>Experience: {experienceText}</span>
            )}
          </div>
        )}
        <div style={styles.detailsRow}>
          <div style={styles.leftDetails}>
            <div style={styles.detailItem}><Icon path={icons.map} /><span>{location}</span></div>
            <div style={styles.detailItem}><Icon path={icons.gender} /><span>{gender}</span></div>
            <div style={styles.detailItem}><Icon path={icons.cake} /><span>{birthDate}</span></div>
          </div>
          <div style={styles.rightDetails}>
            <div style={styles.detailItem}><Icon path={icons.phone} /><span>{phone}</span><svg style={styles.verifiedIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#42b72a" viewBox="0 0 24 24"><path d={checkPath} /></svg></div>
            <div style={styles.detailItem}><Icon path={icons.mail} /><span>{email}</span><svg style={styles.verifiedIcon} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#42b72a" viewBox="0 0 24 24"><path d={checkPath} /></svg></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '16px', padding: '24px 32px', gap: 32, boxShadow: '0 4px 24px rgb(149 157 165 / 20%)', fontFamily: "'Roboto', sans-serif", width: '100%' },
  profileImageWrapper: { position: 'relative', width: 120, height: 120 },
  profileImage: { width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', position: 'absolute', top: 5, left: 5, backgroundColor: '#f6db5c', border: '3px solid transparent', zIndex: 2 },
  progressCircleSvg: { position: 'relative', width: 120, height: 120, zIndex: 1 },
  info: { flex: 1, color: '#1c1e21' },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontWeight: 700, fontSize: 22, margin: 0, color: '#050505' },
  iconBtn: { border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 },
  headline: { margin: '4px 0 6px 0', fontWeight: 600, fontSize: 16, color: '#1a73e8', fontStyle: 'normal' },
  profession: { margin: '4px 0', fontWeight: 600, fontSize: 15, color: '#2563eb', fontStyle: 'italic' },
  degree: { margin: 0, fontWeight: 600, fontSize: 14, color: '#404040' },
  college: { margin: '6px 0 12px 0', fontWeight: 400, fontSize: 14, color: '#505050' },
  divider: { borderBottom: '1px solid #e0e0e0', margin: '8px 0 20px 0' },
  metadataRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metadataPill: { background: '#f1f5f9', color: '#2563eb', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '0.3px' },
  detailsRow: { display: 'flex', gap: 50, fontSize: 14, color: '#555' },
  leftDetails: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 150 },
  rightDetails: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 },
  detailItem: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: '#404040' },
  verifiedIcon: { marginLeft: 4, verticalAlign: 'middle' },
};

export default ProfileTopCard;


