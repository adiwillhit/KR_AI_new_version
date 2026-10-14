export default function Spinner({ size = 24, color = 'var(--color-accent)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid transparent`,
        borderTopColor: color,
        borderRadius: '50%',
        flexShrink: 0,
      }}
      className="animate-spin"
    />
  );
}
