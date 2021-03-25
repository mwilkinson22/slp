import React, { Component, ReactNode, RefObject } from "react";
import { SelectOption } from "~/enum/FormFieldTypes";

interface IProps {
	calculateLength: boolean;
	initialContent: string;
	onChange: (text: string) => void;
	textContent: string;
	variables: SelectOption[];
	variableInstruction: string;
}

interface IState {
	calculatedLength: number;
	formattedContent: ReactNode[];
	textContent: string;
}

export class TweetComposer extends Component<IProps, IState> {
	static defaultProps = {
		calculateLength: true,
		variables: [],
		variableInstruction: "Add Variable"
	};

	textArea: RefObject<any>;
	formattedText: RefObject<any>;

	constructor(props: IProps) {
		super(props);

		//Set Refs
		this.textArea = React.createRef();
		this.formattedText = React.createRef();

		//Set Content
		const textContent = props.initialContent.replace(/\\n/gi, "\n");

		this.state = {
			calculatedLength: 0,
			formattedContent: [],
			textContent
		};
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> {
		const textContent = nextProps.textContent || prevState.textContent;

		//Work out content length and format text
		const { formattedContent, calculatedLength } = TweetComposer.formatContentAndGetLength(textContent);

		return { textContent, formattedContent, calculatedLength };
	}

	static formatContentAndGetLength(textContent: string): Pick<IState, "formattedContent" | "calculatedLength"> {
		const urlRegex = /(?:http:\/\/)?(?:https:\/\/)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&/=]*)/gi;
		const twitterRegex = /[#@](?=[A-Za-z0-9])[A-Za-z0-9_]*/gi;
		const tokenRegex = /%[A-Za-z]+%/gi;
		const highlightRegex = new RegExp(
			"(" + urlRegex.source + "|" + twitterRegex.source + "|" + tokenRegex.source + ")"
		);

		let calculatedLength = 0;
		const formattedContent = textContent.split(highlightRegex).map((str, key) => {
			let className = "";
			if (str.match(urlRegex)) {
				calculatedLength += 23;
				className = "url";
			} else if (str.match(twitterRegex)) {
				calculatedLength += str.length;
				className = "hashtag";
			} else if (str.match(tokenRegex)) {
				calculatedLength += str.length;
				className = "token";
			} else {
				calculatedLength += str.length;
			}
			return (
				<span className={className} key={key}>
					{str}
				</span>
			);
		});

		//Ensure we add a newline to the end
		if (formattedContent.length) {
			const lastElement = formattedContent[formattedContent.length - 1];
			if (lastElement.props.children.slice(-1) === "\n") {
				// formattedContent.push("\n");
			}
		}

		return { calculatedLength, formattedContent };
	}

	componentDidUpdate() {
		this.scrollFormatted();
	}

	updateTextContent(value: string, cb?: () => any) {
		const { onChange } = this.props;
		if (onChange) {
			onChange(value);
		}
		this.setState({ textContent: value }, cb);
	}

	scrollFormatted() {
		this.formattedText.current.scrollTop = this.textArea.current.scrollTop;
	}

	addVariableToTweet(string: string) {
		string += " ";

		const { textContent } = this.state;
		const textArea = this.textArea.current;
		const caretPoint = textArea.selectionStart + string.length;
		let newTextContent;

		//If already selected
		if (textArea.selectionStart || textArea.selectionStart == "0") {
			const start = textArea.selectionStart;
			const end = textArea.selectionEnd;
			newTextContent =
				textContent.substring(0, start) + string + textContent.substring(end, this.state.textContent.length);
		} else {
			newTextContent = textArea.value += string;
		}

		this.updateTextContent(newTextContent, () => {
			textArea.setSelectionRange(caretPoint, caretPoint);
			textArea.focus();
		});
	}

	renderTweetVariables() {
		const { variables, variableInstruction } = this.props;
		if (!variables || !variables.length) {
			return null;
		} else {
			const options = variables.map(function (obj) {
				return (
					<option key={obj.value} value={obj.value}>
						{obj.label}
					</option>
				);
			});
			return (
				<select
					className="tweet-composer-variables"
					onChange={ev => this.addVariableToTweet(ev.target.value)}
					value="null"
				>
					<option value="null" disabled>
						{variableInstruction}
					</option>
					{options}
				</select>
			);
		}
	}

	renderFooter() {
		const { calculateLength } = this.props;
		const { calculatedLength } = this.state;

		let backgroundWidth = "0%";
		let backgroundColor = "#19d";
		let counter = " ";
		if (calculateLength) {
			backgroundWidth = (calculatedLength / 280) * 100 + "%";
			counter = (280 - calculatedLength).toString();
			if (calculatedLength > 280) {
				backgroundColor = "#900";
			}
		}

		return (
			<div className="tweet-composer-footer">
				<div
					className="tweet-composer-footer-background"
					style={{
						width: backgroundWidth,
						backgroundColor: backgroundColor
					}}
				/>
				<div className="tweet-composer-counter">{counter}</div>
				{this.renderTweetVariables()}
			</div>
		);
	}

	render() {
		const { formattedContent } = this.state;
		return (
			<div className="tweet-composer-wrapper">
				<div className="tweet-composer-textbox-wrapper">
					<textarea
						ref={this.textArea}
						className="tweet-composer-source"
						onChange={ev => this.updateTextContent(ev.target.value)}
						onScroll={() => this.scrollFormatted()}
						value={this.state.textContent}
					/>
					<div className="tweet-composer-formatted" ref={this.formattedText}>
						{formattedContent}
					</div>
				</div>
				{this.renderFooter()}
			</div>
		);
	}
}
