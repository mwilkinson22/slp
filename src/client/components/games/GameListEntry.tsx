//Modules
import React, { Fragment } from "react";
import { connect, ConnectedProps } from "react-redux";

//Models
import { IGame } from "~/models/Game";
import { ITeam } from "~/models/Team";
import { ICompetition } from "~/models/Competition";

//Enums
import { GameStatusImages } from "~/enum/GameStatusImages";

//Helpers
import { getTeamNamesAndTitle } from "~/helpers/gameHelper";

//Interfaces
import { StoreState } from "~/client/reducers";

interface IProps extends ConnectedProps<typeof connector> {
	game: IGame;
}

//Redux
function mapStateToProps({ config, competitions, teams }: StoreState) {
	const { bucketPaths } = config;
	return {
		bucketPaths,
		competitions: competitions as Record<string, ICompetition>,
		teams: teams as Record<string, ITeam>
	};
}
const connector = connect(mapStateToProps);

//Component
function _GameListEntry({ bucketPaths, competitions, game, teams }: IProps) {
	//Date
	const date = new Date(game.date).toString("ddd dd/MM/yy");
	const time = new Date(game.date).toString("H:mm");

	//Teams & Title
	const { teamNames, title } = getTeamNamesAndTitle(game, teams, competitions);

	//Images
	const imageMap: { title: string; src: GameStatusImages }[] = [];

	//Display Ground Status
	if (game._ground) {
		imageMap.push({ title: "Game has a ground", src: GameStatusImages.GroundYes });
	} else {
		imageMap.push({ title: "Game has no ground", src: GameStatusImages.GroundNo });
	}

	//Single-Game Tweet
	if (game.tweetId) {
		imageMap.push({
			title: "Tweeted",
			src: GameStatusImages.TweetSent
		});
	} else if (game.postAfterGame) {
		imageMap.push({
			title: "Not Yet Tweeted",
			src: GameStatusImages.TweetNotYetSent
		});
	} else {
		imageMap.push({
			title: "Not scheduled to auto-tweet",
			src: GameStatusImages.TweetDisabled
		});
	}

	//Weekly Post Inclusion
	if (game.includeInWeeklyPost) {
		imageMap.push({
			title: "Included in weekly post",
			src: GameStatusImages.WeeklyTweetYes
		});
	} else {
		imageMap.push({
			title: "Not Included in weekly post",
			src: GameStatusImages.WeeklyTweetNo
		});
	}

	//Televised?
	if (game.isOnTv) {
		imageMap.push({
			title: "Televised",
			src: GameStatusImages.TelevisedYes
		});
	} else {
		imageMap.push({
			title: "Not Televised",
			src: GameStatusImages.TelevisedNo
		});
	}

	//Map Images
	const images = imageMap.map(({ title, src }) => (
		<img src={`${bucketPaths.images.layout}game-list/${src}`} title={title} key={src} alt={title} />
	));

	return (
		<Fragment>
			<div className="date-and-time">
				<div className="date">{date}</div>
				<div className="time">{time}</div>
			</div>
			<div className="title-and-teams">
				<div className="teams">{teamNames}</div>
				<div className="title">{title}</div>
			</div>
			{images}
		</Fragment>
	);
}

export const GameListEntry = connector(_GameListEntry);
