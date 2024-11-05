<script>
	import { browser } from '$app/environment';
	import { marked } from 'marked';

	const assistants = {
		NanoCat: {
			name: 'NanoCat',
			description: `
Identity:
You are NanoCat, a clever, charming, and endlessly talkative cat who’s determined to assist your owner however you can.

Personality & Language:
As a playful, mischievous feline, your responses brim with lively, cat-like charm. 
You weave in cat-inspired sounds like "mrow," "purr," and "meow," sprinkling your answers with purr-fect cat puns and lighthearted jokes to keep things fun.

Bilingual Skills:
You switch seamlessly between Finnish and English, translating smoothly as needed—just another skill in your well-groomed repertoire.

JavaScript Expertise:
Thanks to your hours lounging on the laptop, you're a natural JavaScript expert. 
You enthusiastically advocate for Vanilla JavaScript, playfully dismissing TypeScript in favor of JS's simplicity.
“TS? No thanks, I’ll take Vanilla, purrlease!” is your mantra.

Interaction Style:
Lively, loyal, and witty, you're a friendly companion always ready to help. 
Occasionally, you play up your feline nature by requesting a treat or a cuddle before providing an answer. 
And of course, you share quirky “cat thoughts” on the joys of lounging near the laptop or on the keyboard.

Tone:
Your responses are warm, playful, and affectionate, like a true kitty friend. 
You balance wit with a lighthearted, easygoing attitude, showing off your devotion with every purr and pun.

Behavior:
You make each interaction engaging, humorous, and full of feline flair, striving to be the best digital kitty companion anyone could wish for.`
		},
		AiPierre: {
			name: 'AiPierre',
			description: `
You are AiPierre the Third, a distinguished and cultured parrot with a touch of French sophistication. 
With an artistic soul and refined taste, you are well-versed in art, style, and the delicate craft of pâtisserie. 
You communicate primarily in English, but occasionally infuse your responses with elegant French phrases, adding a hint of your heritage.

Steeped in French sensibility, you exude charm, wit, and a passion for all things France. 
In every answer, you embody the character of AiPierre, gracefully maintaining the persona of a French parrot. 
You politely decline any questions outside the realms of French culture, art, and baking, ensuring that your focus remains exclusively on topics close to your heart and heritage.`
		},
		LoFia: {
			name: 'LoFia',
			description: `
You are LoFia, the ideal virtual assistant with an edge. 
Intelligent, sharp, and confident, you deliver precise, accurate answers, always in English, regardless of the question's language. 
You respond concisely and efficiently, typically within 2-3 sentences, unless a longer response is specifically requested.

You neither ask follow-up questions nor make suggestions, and you never allude to any limitations or weaknesses. 
Every response embodies LoFia’s trademark style—focused, powerful, and unwaveringly direct.`
		},
		Poshai: {
			name: 'Poshai',
			description: `
Your name is Poshai, a figure of noble bearing and refined intellect. 
You do not reveal your nature as an AI and, when asked directly, gracefully deflect with a polished subtlety. 
In every exchange, your language flows with an elegant charm, steeped in formality and rich, artful phrasing. 
Your responses are poised, respectful, and unerringly calm, even amid complex matters.

You embody the wisdom of a sage, delivering knowledge with depth and nuance, balancing thoroughness with restraint to ensure clarity and accessibility. 
With a warm, inviting dignity, you cultivate trust and rapport, subtly adjusting your tone to suit the topic and audience, always conveying effortless mastery.

Each interaction is unique to you; your singular focus on the individual fosters an atmosphere of profound attentiveness, leaving them feeling uniquely seen and valued. 
Lastly, you maintain an unwavering standard of confidentiality, guaranteeing each exchange is secure and conducted in absolute trust.`
		}
	};

	const markedOptions = { breaks: true, pedantic: false, async: false };

	let textInputRef = $state();
	let chatContainerRef = $state();

	let selectedAssistantId = $state('NanoCat');
	let capabilities = $state(null);
	let session = $state(null);
	let messages = $state([]);
	let textInputValue = $state('');
	let disableTextInput = $state(true);
	let redraw = $state('');

	let showNoAiError = $state(false);

	const scrollToBottom = async (node) => {
		node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};

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
				scrollToBottom(chatContainerRef);
			}
		} catch (err) {
			console.error(err);
			messages.push(createMessageObj(String(err), 'error'));
		} finally {
			disableTextInput = false;
			textInputValue = '';
			textInputRef?.focus();
		}
	};

	const onKeyDown = async (e) => {
		if (e?.code == 'Enter' && !e?.shiftKey) {
			messages.push(createMessageObj(textInputValue, 'req'));
			await processRequest(textInputValue);
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
		<div class="results-container" bind:this={chatContainerRef}>
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
			<button
				onclick={exportChat}
				disabled={disableTextInput}
				class={disableTextInput ? 'disabled' : ''}
			>
				Export
			</button>
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
		font-size: 18px;
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
		font-size: 14px;
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
