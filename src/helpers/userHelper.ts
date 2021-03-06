export function getUsernameErrors(username: string): string | void {
	//Check length
	if (username.length < 2) {
		return "Username must be at least two characters long";
	}

	//Check regex
	if (username.match(/[^0-9A-Za-z-_]/)) {
		return "Usernames can only contain letters, numbers, underscores and hyphens";
	}

	//Make sure it's not "new"
	if (username.toLowerCase() === "new") {
		return "Username cannot be 'new'";
	}
}

export function getPasswordErrors(password: string): string | void {
	//Check length
	if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{6,}$/)) {
		return "Password must be at least 6 characters long, and contain an uppercase letter, a lowercase letter and a number";
	}
}
