<script>
	import { onMount, onDestroy } from 'svelte';

	let title = 'Aloha Countdown';
	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	let targetDate = new Date();
	let videoFilename = '';
	let interval;


	// Get target date from environment variable or use default
	onMount(() => {
		// Get target date and video filename from environment variable placeholders
		// This will be replaced during Docker build
		const envTargetDate = 'TARGET_DATE_PLACEHOLDER';
		const envVideoFilename = 'VIDEO_FILENAME_PLACEHOLDER';
		targetDate = new Date(envTargetDate);
		videoFilename = envVideoFilename;
		
		// Validate the date
		if (isNaN(targetDate.getTime())) {
			console.warn('Invalid TARGET_DATE, using default date');
			targetDate = new Date('2025-01-01T00:00:00');
		}

		updateCountdown();
		interval = setInterval(updateCountdown, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	function updateCountdown() {
		const now = new Date().getTime();
		const target = targetDate.getTime();
		const difference = target - now;

		if (difference > 0) {
			days = Math.floor(difference / (1000 * 60 * 60 * 24));
			hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			seconds = Math.floor((difference % (1000 * 60)) / 1000);
		} else {
			days = 0;
			hours = 0;
			minutes = 0;
			seconds = 0;
		}
	}

	function formatDate(date) {
		const months = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];

		const day = date.getDate();
		const month = months[date.getMonth()];
		const year = date.getFullYear();

		// Add ordinal suffix to day
		let dayWithSuffix;
		if (day >= 11 && day <= 13) {
			dayWithSuffix = day + 'th';
		} else {
			switch (day % 10) {
				case 1: dayWithSuffix = day + 'st'; break;
				case 2: dayWithSuffix = day + 'nd'; break;
				case 3: dayWithSuffix = day + 'rd'; break;
				default: dayWithSuffix = day + 'th';
			}
		}

		return `${month} ${dayWithSuffix}, ${year}`;
	}
</script>

<!-- Background Video -->
<div class="video-background">
	<video autoplay muted loop playsinline>
		<source src="./assets/{videoFilename}" type="video/mp4">
		<!-- Fallback for browsers that don't support video -->
		<div class="video-fallback"></div>
	</video>
	<div class="video-overlay"></div>
</div>

<main>
	<div class="countdown-container">
		<h1>🌺 {title} 🌺</h1>
		<p class="hawaiian-subtitle">{days} days until we outta' here</p>
		<div class="countdown-display">
			<div class="time-unit">
				<div class="time-value">{days}</div>
				<div class="time-label">Days</div>
			</div>
			<div class="time-unit">
				<div class="time-value">{hours}</div>
				<div class="time-label">Hours</div>
			</div>
			<div class="time-unit">
				<div class="time-value">{minutes}</div>
				<div class="time-label">Minutes</div>
			</div>
			<div class="time-unit">
				<div class="time-value">{seconds}</div>
				<div class="time-label">Seconds</div>
			</div>
		</div>
		<div class="target-date">
			<span class="wave-icon">🌊</span>{formatDate(targetDate)}<span class="wave-icon">🌊</span>
		</div>
	</div>
</main>

<style>
	/* Global Body Styles */
	:global(body) {
		margin: 0;
		font-family: 'Open Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}

	:global(#app) {
		min-height: 100vh;
		position: relative;
	}

	/* Video Background Styles */
	.video-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2;
		overflow: hidden;
	}

	.video-background video {
		min-width: 100%;
		min-height: 100%;
		width: auto;
		height: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		object-fit: cover;
	}

	.video-fallback {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #0066cc 0%, #00aaff 50%, #66ccff 100%);
		background-image: 
			radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(0, 102, 204, 0.5) 0%,
			rgba(0, 170, 255, 0.5) 30%,
			rgba(102, 204, 255, 0.5) 70%,
			rgba(255, 255, 255, 0.5) 100%
		);
		z-index: -1;
	}

	main {
		text-align: center;
		padding: 1em;
		max-width: 800px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.countdown-container {
		padding: 1rem;
		color: white;
		position: relative;
		overflow: hidden;
	}

	.countdown-container::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		pointer-events: none;
	}

	@keyframes shimmer {
		0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
		50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
	}

	h1 {
		font-family: 'Mauna Loa', 'Open Sans', sans-serif;
		font-size: 3rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
		text-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.5),
			0 0 20px rgba(255, 255, 255, 0.3);
		letter-spacing: 2px;
		position: relative;
		z-index: 2;
	}

	.hawaiian-subtitle {
		font-family: 'Open Sans', sans-serif;
		font-size: 1.2rem;
		margin-bottom: 2rem;
		opacity: 1;
		font-style: italic;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 2;
	}

	.countdown-display {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		position: relative;
		z-index: 2;
	}

	.time-unit {
		background: linear-gradient(145deg, 
			rgba(255, 255, 255, 0.2) 0%, 
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0.05) 100%
		);
		border-radius: 20px;
		padding: 2rem;
		min-width: 140px;
		backdrop-filter: blur(15px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 
			0 8px 25px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		position: relative;
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.time-unit::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.time-value {
		font-family: 'Mauna Loa', 'Open Sans', sans-serif;
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-shadow: 
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 0 15px rgba(255, 255, 255, 0.3);
		background: linear-gradient(45deg, #ffffff, #f0f8ff, #ffffff);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		position: relative;
		z-index: 2;
	}

	.time-label {
		font-family: 'Open Sans', sans-serif;
		font-size: 1.1rem;
		opacity: 0.95;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 2;
	}

	.target-date {
		font-family: 'Open Sans', sans-serif;
		font-size: 1.3rem;
		opacity: 0.9;
		margin: 1rem 0 2rem;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 2;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.8rem 1.5rem;
		border-radius: 15px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		display: inline-block;
	}

	.wave-icon {
		margin: 0 1rem;
	}

	@media (max-width: 768px) {
		.countdown-display {
			gap: 1rem;
		}
		
		.time-unit {
			min-width: 100px;
			padding: 0.5rem;
		}
		
		.time-value {
			font-size: 2.5rem;
		}
		
		h1 {
			font-size: 2.2rem;
			letter-spacing: 1px;
		}

		.hawaiian-subtitle {
			font-size: 1rem;
		}

		.target-date {
			font-size: 1.1rem;
			padding: 0.6rem 1rem;
		}

		.countdown-container {
			padding: 1rem;
			margin: 1rem;
		}

		.wave-icon {
			margin: 0 0.5rem;

		}
	}
</style>
