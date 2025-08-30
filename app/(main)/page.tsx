/** @format */

import { Assistant } from '@/components/assistant';
import { ScrollArea } from '@radix-ui/react-scroll-area';

export default function MainPage() {
	return (
		<>
			<ScrollArea className="flex-1 overflow-hidden ">
				
					<Assistant />
				
			</ScrollArea>
		</>
	);
}
