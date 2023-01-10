import styled from 'styled-components/macro'

const AlertWrapper = styled.div`
  max-width: 460px;
  width: 100%;
`

export default function Footer() {
  function emptyCache() {
    if ('caches' in window) {
      caches.keys().then((names) => {
        // Delete all the cache files
        names.forEach((name) => {
          caches.delete(name)
        })
      })

      // Makes sure the page reloads. Changes are only visible after you refresh.
      window.location.reload()
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#33333388',
        width: '100%',
        height: '40px',
        position: 'fixed',
        bottom: '0px',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div style={{ padding: '10px' }}>
          <h5 style={{ fontWeight: 'normal' }}>&copy;2022 RadiusXYZ</h5>
        </div>
        <div
          style={{
            padding: '10px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={emptyCache}
            style={{ height: '30px', border: 'none', marginRight: '10px', background: 'transparent' }}
          >
            &nbsp;
          </button>
          <a href="/#" style={{ textDecoration: 'none', color: '#ffffff' }}>
            <h5 style={{ fontWeight: 'normal' }}>Privacy Policy</h5>
          </a>
        </div>
      </div>
    </div>
  )
}
