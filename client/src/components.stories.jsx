import React from 'react';

// 1. Story Big Cookie
export const BigCookieStory = () => {
  const [clicks, setClicks] = React.useState(0);
  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>Composant Cookie Cliquable</h3>
      <button
        onClick={() => setClicks(c => c + 1)}
        style={{
          fontSize: '70px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.1s ease',
          outline: 'none'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🍪
      </button>
      <p>Clics enregistrés dans la story : <strong>{clicks}</strong></p>
    </div>
  );
};
BigCookieStory.storyName = 'Big Cookie (Interactive)';

// 2. Story Shop Item
export const ShopItemStory = () => {
  return (
    <div style={{ maxWidth: '380px', padding: '15px', background: '#fdfaf3', border: '1px solid #fed7aa', borderRadius: '12px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#9a3412' }}>🏪 Carte Bâtiment Boutique</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <strong>👆 Curseur</strong> (+1 CPS)<br />
          <small style={{ color: '#78350f' }}>Possédés : 3 | Prix : 22</small>
        </div>
        <button style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#ea580c', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          Acheter
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
        <div>
          <strong>👵 Grand-mère</strong> (+5 CPS)<br />
          <small style={{ color: '#78350f' }}>Possédées : 0 | Prix : 100</small>
        </div>
        <button disabled style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#9ca3af', color: 'white', fontWeight: 'bold' }}>
          Verrouillé
        </button>
      </div>
    </div>
  );
};
ShopItemStory.storyName = 'Shop Item (Affordable vs Locked)';

// 3. Story Sync Status Badge
export const StatusBadgeStory = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'sans-serif', maxWidth: '350px' }}>
      <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem' }}>
        🟢 Synchronisé avec le serveur (14:20:00)
      </div>
      <div style={{ padding: '8px 12px', background: '#f3f4f6', color: '#4b5563', borderRadius: '8px', fontSize: '0.85rem' }}>
        ⚪ Mode hors-ligne (serveur non joignable)
      </div>
      <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem' }}>
        ⚠️ Alerte anti-triche détectée (HTTP 400)
      </div>
    </div>
  );
};
StatusBadgeStory.storyName = 'Sync Status Badges';

// 4. Story Counter (Zero / Mid Game / End Game)
export const CounterStory = () => {
  return (
    <div style={{ display: 'grid', gap: '12px', maxWidth: '380px', fontFamily: 'sans-serif', background: '#21170f', color: '#fff3dc', padding: '16px', borderRadius: '14px' }}>
      <div>
        <small style={{ color: '#c4a982' }}>Début de partie</small>
        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0 cookies</div>
        <div style={{ fontSize: '0.85rem', color: '#ffdb9c' }}>⚡ 0 / sec</div>
      </div>
      <div>
        <small style={{ color: '#c4a982' }}>Milieu de partie</small>
        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>14 520 cookies</div>
        <div style={{ fontSize: '0.85rem', color: '#ffdb9c' }}>⚡ 32 / sec</div>
      </div>
      <div>
        <small style={{ color: '#c4a982' }}>Fin de partie</small>
        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>1 200 000 000 cookies</div>
        <div style={{ fontSize: '0.85rem', color: '#ffdb9c' }}>⚡ 1 500 000 / sec</div>
      </div>
    </div>
  );
};
CounterStory.storyName = 'Counter (Zero / Mid / End Game)';

// 5. Story Error Banner (DEV vs PROD)
export const ErrorBannerStory = () => {
  return (
    <div style={{ display: 'grid', gap: '10px', maxWidth: '520px', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '12px 16px', background: '#471f1b', color: '#ffe2dc', border: '1px solid #b45348', borderRadius: '10px', fontSize: '0.85rem' }}>
        <strong>Mode PROD :</strong> Une erreur interne est survenue. Votre partie reste sauvegardée en local.
      </div>
      <div style={{ padding: '12px 16px', background: '#471f1b', color: '#ffe2dc', border: '1px solid #b45348', borderRadius: '10px', fontSize: '0.85rem' }}>
        <strong>Mode DEV :</strong> Incrément de cookies anormal détecté [DEV: ANTI_CHEAT_FLAG · req_1763558400_a1b2c3]
      </div>
    </div>
  );
};
ErrorBannerStory.storyName = 'Error Banner (DEV vs PROD)';
