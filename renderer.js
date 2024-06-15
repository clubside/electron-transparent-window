'use strict'

/**
 * Convert all `a` link elements to open in the user's default browser.
 */
function captureLinks() {
	const links = document.getElementsByTagName('a')
	for (const link of links) {
		link.addEventListener('click', (event) => {
			event.preventDefault()
			window.electronAPI.openLink(event.target.href)
		})
	}
}

document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM loaded')
	captureLinks()
})
