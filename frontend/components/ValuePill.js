// frontend/components/ValuePill.js

export default function ValuePill({ children }) {
  return (
    <span className="inline-block bg-violet-100 text-violet-800 text-sm font-semibold mr-2 mb-2 px-3 py-1 rounded-full">
      {children}
    </span>
  );
}