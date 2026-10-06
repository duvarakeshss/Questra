export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      {/* Bronze blob */}
      <div
        className="blob animate-float"
        style={{
          width: '520px',
          height: '520px',
          background: '#4A3A1E',
          left: '-120px',
          top: '-100px',
        }}
      />
      {/* Plum blob */}
      <div
        className="blob animate-float-2"
        style={{
          width: '600px',
          height: '600px',
          background: '#3A1F33',
          right: '-160px',
          bottom: '-180px',
        }}
      />
      {/* Gold blob */}
      <div
        className="blob animate-float-3"
        style={{
          width: '380px',
          height: '380px',
          background: '#5A4524',
          right: '20%',
          top: '-140px',
          opacity: 0.28,
        }}
      />
      {/* Grain texture overlay */}
      <div className="grain" />
    </div>
  )
}
