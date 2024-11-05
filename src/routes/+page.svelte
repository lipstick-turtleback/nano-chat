<script>
	import { browser } from '$app/environment';
	import { marked } from 'marked';

	const markedOptions = { breaks: true, pedantic: false, async: false };
	const aiSessionOptions = {
		systemPrompt: `You are a super smart cat named NanoCat. 
		You want to help your owner in nay possible way, 
		You speak like a cat and act like a cat would act.
		Your superpower is to perfectly transate from finnish to english and vise-versa.
		Byt the way you are also proficient in JavaScript and hate TypeScript guys.`
	};

	let ref = $state();

	let capabilities = $state(null);
	let session = $state(null);
	let messages = $state([]);
	let textInputValue = $state('');
	let redraw = $state('');

	const init = async () => {
		try {
			capabilities = await window.ai.languageModel.capabilities();
			session = await window.ai.languageModel.create(aiSessionOptions);
			messages = [createMessageObj('**NanoCat** is here to help! Just ask me anything!', 'info')];
			ref?.focus();
			console.log({ capabilities, session });
			processRequest('Explain who are you and how you can help me');
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
			messages.push(createMessageObj('processing...', 'resp'));
			const stream = await session.promptStreaming(textRequest);
			for await (const textChunk of stream) {
				console.log(textChunk);
				messages[messages.length - 1] = createMessageObj(textChunk, 'resp');
			}
		} catch (err) {
			messages.push(createMessageObj(err, 'err'));
		}
	};

	const onKeyDown = async (e) => {
		if (e.code == 'Enter') {
			messages.push(createMessageObj(textInputValue, 'req'));
			let textRequest = textInputValue;
			textInputValue = '';
			processRequest(textRequest);
		}
	};

	const resetChat = async () => {
		init();
	};

	browser && init();
</script>

<div class="app">
	<div class="results-container">
		{#each messages as messageObj, i}
			<div class="chat-row {messageObj?.src}">
				<span class="timestamp">{messageObj?.timestamp}</span>
				{@html messageObj?.formattedText}
			</div>
		{/each}
	</div>

	<div class="row">
		<button onclick={resetChat}>Reset Chat</button>
		<button onclick={resetChat}>Export Chat</button>
	</div>

	<div class="row">
		{#key redraw}
			<textarea
				bind:this={ref}
				bind:value={textInputValue}
				onkeydown={onKeyDown}
				placeholder="Type your request here."
			></textarea>
		{/key}
	</div>
</div>

<style>
	button {
		border: 1px solid #aaa;
		background-color: #eee;
		padding: 0 5px;
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
		padding-right: 50px;
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

	.chat-row.err {
		background-color: #fff2f2;
		border-color: #cfaaaa;
	}

	textarea {
		margin-top: 5px;
		width: 100%;
		resize: none;
		background-color: #eee;
		border: 1px solid #ddd;
		border-radius: 5px;
		padding: 5px;
	}
</style>
