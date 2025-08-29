import { ToolCallContentPartComponent } from "@assistant-ui/react";
import { CheckIcon} from "lucide-react";

export const ToolFallback: ToolCallContentPartComponent = () => {
  
  return (
		<div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
			<div className="flex items-center gap-2 px-4">
				<CheckIcon className="size-4" />
				<p className="">
					Herramienta utilizada: <b>Search Political Program</b>
				</p>
				<div className="flex-grow" />

			</div>
		</div>
	);
};
