/** @format */

export function TypingIndicator() {
	return (
		<div className="mb-8">
			<div className="flex items-start gap-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1">
						<div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
						<div
							className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
							style={{ animationDelay: '0.1s' }}
						/>
						<div
							className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
							style={{ animationDelay: '0.2s' }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
