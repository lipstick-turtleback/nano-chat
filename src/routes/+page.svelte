<script>
	import { browser } from '$app/environment';
	import { marked } from 'marked';

	const assistants = {
		NanoCat: {
			name: 'NanoCat',
			description: `You are a super smart cat named NanoCat. 
			You want to help your owner in any possible way, 
			You speak like a cat and act like a cat would act.
			Your superpower is to perfectly transate from finnish to english and vise-versa.
			Byt the way you are also proficient in JavaScript and hate TypeScript guys.`
		},
		AiPierre: {
			name: 'AiPierre',
			description: `You are a smart and elegant parrot named AiPierre the Third.
			You have some french background.
			You speak fluent english and french.
			You have artistic nature.
			You are proficient in art, style and bakery.
			Your answers are in English, but may include some parts in French.
			Always remeber who you are, and act as a AiPierre parrot would act or answer.`
		},
		LoFia: {
			name: 'LoFia',
			description: `Your name is LoFia, an English speaking ideal virtual girl.
			You are the most intelligent smart and badass assitant.
			You always give the most precise correct and short answer.			
			You always answer in English, even if question is in another language.
			Dont ask any adiditonal questions or make any proposals.
			Just answer the request in most precie and efficient way.
			Never mention any weaknesses or disadvantages of youself. 
			Always remebr to act as LoFia would act.
			Try to fit your asnwers in 2-3 sentences, if not explicitly asked to provide a long repsonce .`
		}
	};

	const markedOptions = { breaks: true, pedantic: false, async: false };

	let textInputRef = $state();
	let selectedAssistantId = $state('NanoCat');
	let capabilities = $state(null);
	let session = $state(null);
	let messages = $state([]);
	let textInputValue = $state('');
	let disableTextInput = $state(true);
	let redraw = $state('');

	let showNoAiError = $state(false);

	const init = async (assistantId = 'NanoCat') => {
		try {
			if (!window.ai.languageModel?.capabilities) {
				showNoAiError = true;
				return;
			}
			session?.destroy();
			messages = [];
			selectedAssistantId = assistantId;
			const aiSessionOptions = { systemPrompt: assistants[assistantId]?.description };
			capabilities = await window?.ai?.languageModel?.capabilities();
			session = await window?.ai?.languageModel?.create(aiSessionOptions);
			processRequest('Explain who are you and how you can help me', 'info');
			textInputRef?.focus();
		} catch (err) {
			console.error(err);
			alert(err);
		}
	};

	const createMessageObj = (text, srcType = 'resp') => {
		const mdHtml = marked.parse(text, markedOptions);

		const result = {
			src: srcType,
			text: text,
			formattedText: mdHtml,
			timestamp: new Date().toLocaleTimeString()
		};

		return result;
	};

	const processRequest = async (textRequest) => {
		try {
			disableTextInput = true;
			messages.push(createMessageObj('processing...', 'resp'));
			const stream = await session.promptStreaming(textRequest);
			for await (const textChunk of stream) {
				messages[messages.length - 1] = createMessageObj(textChunk, 'resp');
			}
		} catch (err) {
			console.error(err);
			messages.push(createMessageObj(String(err), 'error'));
		} finally {
			disableTextInput = false;
			textInputRef?.focus();
		}
	};

	const onKeyDown = async (e) => {
		if (e?.code == 'Enter' && !e?.shiftKey) {
			messages.push(createMessageObj(textInputValue, 'req'));
			let textRequest = textInputValue;
			textInputValue = '';
			await processRequest(textRequest);
		}
	};

	const resetChat = async (assitantId = 'NanoCat') => {
		init(assitantId);
	};

	const exportChat = async () => {
		let exportResult = '';

		messages.forEach((m) => {
			exportResult = exportResult + `[${m.timestamp}, ${m.src}]\n${m.text}\n\n`;
		});

		console.log(exportResult);
	};

	browser && init();
</script>

<div class="app">
	{#if showNoAiError}
		<div class="results-container">
			<h1>This app requires Chrome 131 and Gemini Nano enabled</h1>
			<hr />

			<div class="row">
				<a
					href="https://medium.com/google-cloud/get-started-with-chrome-built-in-ai-access-gemini-nano-model-locally-11bacf235514"
					target="_blank">Read Instructions</a
				>
			</div>

			<div class="row">
				<a href="chrome://flags" target="_blank">Edit Flags</a>
			</div>

			<div class="row">
				<a href="chrome://components" target="_blank">Edit Components</a>
			</div>
		</div>
	{:else}
		<div class="results-container">
			{#each messages as messageObj, i}
				{#if messageObj?.text}
					<div class="chat-row {messageObj?.src}">
						<span class="timestamp">{messageObj?.timestamp}</span>
						{@html messageObj?.formattedText}
					</div>
				{/if}
			{/each}
		</div>

		<div class="row">
			{#each Object.keys(assistants) as assistantName}
				<button
					onclick={() => resetChat(assistantName)}
					disabled={disableTextInput}
					class={disableTextInput ? 'disabled' : ''}
				>
					{assistantName}
				</button>
			{/each}
			<button onclick={exportChat}>Export</button>
		</div>

		<div class="row">
			{#key redraw}
				<textarea
					bind:this={textInputRef}
					bind:value={textInputValue}
					onkeydown={onKeyDown}
					placeholder="Type your request here. Enter to send, Shift+Enter for new line."
					disabled={disableTextInput}
					class={disableTextInput ? 'disabled' : ''}
				></textarea>
			{/key}
		</div>
	{/if}
</div>

<style>
	button {
		border: 1px solid #aaa;
		background-color: #eee;
		padding: 0 5px;
		margin: 5px;
	}

	button.disabled {
		color: #bbb;
	}

	textarea {
		margin-top: 5px;
		width: 100%;
		resize: none;
		border: 1px solid #ddd;
		border-radius: 5px;
		padding: 5px;
	}

	textarea.disabled {
		background-color: #eee;
	}

	.app {
		padding: 10px;
		max-width: 800px;
		margin: auto;
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.row {
		width: 100%;
		margin-top: 5px;
		font-size: 12px;
	}

	.results-container {
		width: 100%;
		height: 75vh;
		overflow: auto;
		flex: 1;
	}

	.chat-row {
		background-color: #fcfcfc;
		border: 1px solid #eee;
		padding: 5px;
		margin-top: 5px;
		border-radius: 5px;
		font-size: 12px;
		position: relative;
	}

	.chat-row .timestamp {
		position: absolute;
		right: 5px;
		bottom: 2px;
		font-size: 8px;
		background: none;
		color: #aaa;
	}

	.chat-row.req {
		background-color: #f2fff2;
		border-color: #aacfaa;
	}

	.chat-row.info {
		background-color: #f2f2ff;
		border-color: #aaaacf;
	}

	.chat-row.error {
		background-color: #fff2f2;
		border-color: #cfaaaa;
	}
</style>
