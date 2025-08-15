const fs = require('fs');
const path = require('path');

// Add comprehensive hero styles to all pages that need them
const heroStyles = `
<style>
/* Hero Section - Unified Design */
.hero, .hero-gradient, .city-hero, .about-hero, .faq-hero {
	background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%);
	background-size: 200% 200%;
	animation: gradientShift 8s ease infinite;
	color: white;
	padding: 4rem 0 6rem;
	text-align: center;
	position: relative;
	overflow: hidden;
}

@keyframes gradientShift {
	0% { background-position: 0% 50%; }
	50% { background-position: 100% 50%; }
	100% { background-position: 0% 50%; }
}

.wave-bottom::before, .hero::before {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 100px;
	background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,181.3C960,181,1056,139,1152,117.3C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") no-repeat;
	background-size: cover;
	animation: wave 10s linear infinite;
}

@keyframes wave {
	0% { transform: translateX(0); }
	100% { transform: translateX(-50%); }
}

.hero-content {
	position: relative;
	z-index: 2;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 2rem;
}

.hero-title {
	font-family: 'Bebas Neue', sans-serif;
	font-size: 4rem;
	font-weight: 700;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 3px;
	line-height: 1.1;
	text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
	animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
	0%, 100% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); }
	50% { text-shadow: 2px 2px 20px rgba(255, 255, 255, 0.3); }
}

.hero-subtitle {
	font-size: 1.3rem;
	opacity: 0.95;
	max-width: 700px;
	margin: 0 auto 2rem;
	line-height: 1.6;
}

.hero-buttons, .hero-cta {
	display: flex;
	gap: 1rem;
	justify-content: center;
	margin-top: 2rem;
	flex-wrap: wrap;
}

.btn-enhanced, .btn-black {
	background: #000000;
	color: white;
	border: 3px solid #000000;
	border-radius: 50px;
	padding: 1.2rem 2.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 1px;
	transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	text-decoration: none;
	display: inline-block;
	position: relative;
	overflow: hidden;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.btn-enhanced:hover, .btn-black:hover {
	background: #1a1a1a;
	border-color: #333333;
	transform: translateY(-5px) scale(1.05);
	box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.service-note {
	margin-top: 1.5rem;
	opacity: 0.9;
	font-size: 1.1rem;
}

/* Container fix */
.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 2rem;
	width: 100%;
}

/* About page specific fixes */
.about-hero .hero-content {
	text-align: center;
	width: 100%;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
	.hero-title {
		font-size: 2.5rem;
	}
	
	.hero-subtitle {
		font-size: 1.1rem;
	}
	
	.hero-buttons {
		flex-direction: column;
		align-items: center;
	}
	
	.btn-enhanced {
		width: 100%;
		max-width: 300px;
	}
}
</style>
`;

// Function to add styles before closing </Layout> tag
function addHeroStyles(filePath) {
	let content = fs.readFileSync(filePath, 'utf8');
	
	// Check if the page already has proper hero styles
	if (content.includes('@keyframes gradientShift') && content.includes('.hero-title')) {
		console.log(`✓ ${path.basename(filePath)} already has hero styles`);
		return false;
	}
	
	// Add the styles before </Layout>
	if (content.includes('</Layout>')) {
		content = content.replace('</Layout>', heroStyles + '\n</Layout>');
		fs.writeFileSync(filePath, content);
		console.log(`✅ Added hero styles to ${path.basename(filePath)}`);
		return true;
	}
	
	return false;
}

// Fix the about page
const aboutPage = 'src/pages/about.astro';
if (fs.existsSync(aboutPage)) {
	addHeroStyles(aboutPage);
}

// Fix all location pages
function findAstroFiles(dir, files = []) {
	const items = fs.readdirSync(dir);
	for (const item of items) {
		const fullPath = path.join(dir, item);
		if (fs.statSync(fullPath).isDirectory()) {
			findAstroFiles(fullPath, files);
		} else if (item.endsWith('.astro')) {
			files.push(fullPath);
		}
	}
	return files;
}

const locationFiles = findAstroFiles('src/pages/locations');
let fixedCount = 0;

locationFiles.forEach(file => {
	if (addHeroStyles(file)) {
		fixedCount++;
	}
});

console.log(`\n🎉 Fixed ${fixedCount} location files with proper hero styles!`);