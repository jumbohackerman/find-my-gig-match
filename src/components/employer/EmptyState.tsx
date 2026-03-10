import { Inbox } from "lucide-react";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon, title, description, action }: Props) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
      {icon || <Inbox className="w-5 h-5 text-muted-foreground" />}
    </div>
    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
    <p className={`text-xs text-muted-foreground max-w-[240px] ${action ? "mb-4" : ""}`}>{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
