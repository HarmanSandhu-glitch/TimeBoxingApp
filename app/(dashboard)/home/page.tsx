import { TimeBoxView } from "@/components/TimeBoxView";
import { getTodayString } from "@/lib/utils";

export default function HomePage() {
  const today = getTodayString();
  return <TimeBoxView date={today} />;
}
