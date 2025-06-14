
// This file should not re-export useToast as it creates circular imports
// The useToast hook is already available from @/hooks/use-toast
// This file can be removed or kept minimal for backward compatibility

export { useToast } from "@/hooks/use-toast";
