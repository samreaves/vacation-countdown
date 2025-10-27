<script>
	import { onMount, onDestroy } from 'svelte';

	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	let targetDate = new Date();
	let interval;

	// Get target date from environment variable or use default
	onMount(() => {
		// Get target date from environment variable placeholder
		// This will be replaced during Docker build
		const envTargetDate = 'TARGET_DATE_PLACEHOLDER';
		targetDate = new Date(envTargetDate);
		
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
</script>

<main>
	<div class="countdown-container">
		<h1>Countdown Timer</h1>
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
			Target Date: {targetDate.toLocaleDateString()}
		</div>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 800px;
		margin: 0 auto;
	}

	.countdown-container {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20px;
		padding: 2rem;
		color: white;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 2rem;
		font-weight: 300;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.countdown-display {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.time-unit {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 15px;
		padding: 1.5rem;
		min-width: 120px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.time-value {
		font-size: 3rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.time-label {
		font-size: 1rem;
		opacity: 0.9;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.target-date {
		font-size: 1.2rem;
		opacity: 0.8;
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.countdown-display {
			gap: 1rem;
		}
		
		.time-unit {
			min-width: 80px;
			padding: 1rem;
		}
		
		.time-value {
			font-size: 2rem;
		}
		
		h1 {
			font-size: 2rem;
		}
	}
</style>
