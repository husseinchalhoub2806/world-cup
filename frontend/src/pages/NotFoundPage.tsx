import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center p-4">
      <div>
        <div className="text-8xl mb-6">⚽</div>
        <h1 className="text-4xl font-black text-white mb-2">Red Card!</h1>
        <p className="text-gray-400 mb-8">This page doesn't exist.</p>
        <Link to="/" className="btn-gold">Back to Home</Link>
      </div>
    </div>
  );
}
