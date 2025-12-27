// components/ui/LoadingIndicator.tsx
import PacmanLoader from "react-spinners/PacmanLoader";

export default function LoadingIndicator({ text = "", size = 25 }) {
  return (
    <div className="flex justify-center items-center text-earth-stone py-6 gap-3">
      <PacmanLoader color="#A4AC86" size={size} />
      <span>{text}</span>
    </div>
  );
}