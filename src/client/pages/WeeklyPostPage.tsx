//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { ServerContentPreview } from "~/client/components/forms/ServerContentPreview";

//Actions
import { fetchAllGames, previewWeeklyPostImage, submitWeeklyPost } from "~/client/actions/gameActions";
import { fetchAllCompetitions } from "~/client/actions/competitionActions";
import { fetchAllTeams } from "~/client/actions/teamActions";
import { fetchAllSocialProfiles } from "~/client/actions/socialActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IGame, IWeeklyPostFields } from "~/models/Game";
import { FormFieldTypes, IFieldGroup, SelectOption, SelectOptionGroup } from "~/enum/FormFieldTypes";
import { getGameWeek, getTeamNamesAndTitle } from "~/helpers/gameHelper";
import { ISettings } from "~/models/Settings";
import { yupTweetValidator } from "~/helpers/formHelper";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	gamesThisWeek: IGame[];
	gamesAsOptions: SelectOptionGroup[];
	isLoading: boolean;
	socialProfileAsOptions: SelectOption[];
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ competitions, config, games, teams, socialProfiles }: StoreState) {
	const { settings } = config;
	return { settings: settings as ISettings, games, competitions, socialProfiles, teams };
}
const mapDispatchToProps = {
	fetchAllGames,
	fetchAllCompetitions,
	fetchAllTeams,
	fetchAllSocialProfiles,
	previewWeeklyPostImage,
	submitWeeklyPost
};
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _WeeklyPostPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const {
			socialProfiles,
			fetchAllSocialProfiles,
			fetchAllGames,
			games,
			competitions,
			fetchAllCompetitions,
			teams,
			fetchAllTeams
		} = props;

		//Ensure we have social profiles
		let isLoading = false;
		if (!socialProfiles) {
			fetchAllSocialProfiles();
			isLoading = true;
		}

		//Ensure we have games
		if (!games) {
			fetchAllGames();
			isLoading = true;
		}

		//Ensure we have competitions
		if (!competitions) {
			fetchAllCompetitions();
			isLoading = true;
		}

		//Ensure we have teams
		if (!teams) {
			fetchAllTeams();
			isLoading = true;
		}

		const validationSchema = Yup.object().shape({
			_profile: Yup.string().required().label("Social Profile"),
			games: Yup.array().of(Yup.string()).required("At least one game must be selected").label("Games"),
			text: yupTweetValidator().label("Text"),
			postToFacebook: Yup.boolean().label("Post to Facebook?")
		});

		this.state = {
			gamesThisWeek: [],
			gamesAsOptions: [],
			isLoading,
			socialProfileAsOptions: [],
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps: IProps): Partial<IState> | null {
		const { competitions, games, socialProfiles, teams, settings } = nextProps;

		if (!socialProfiles || !games || !competitions || !teams) {
			return null;
		}

		const socialProfileAsOptions = _.chain(socialProfiles)
			.sortBy(({ isDefault, name }) => `${isDefault ? 0 : 1}${name.toLowerCase()}`)
			.map(profile => ({
				label: `${profile.name}${profile.isDefault ? " (Default)" : ""}`,
				value: profile._id
			}))
			.value();

		const gamesThisWeek = _.filter(games, game => getGameWeek(game, settings) === "This Week");
		const gamesAsOptions = _.chain(gamesThisWeek)
			//Grab team names, competition name and set date object
			.map(game => {
				const { teamNames } = getTeamNamesAndTitle(game, teams, competitions);
				return {
					...game,
					_competition: competitions[game._competition].name,
					teamNames,
					date: new Date(game.date)
				};
			})
			//Sort
			.orderBy(["_competition", "date"])
			//Group
			.groupBy("_competition")
			.map((gamesByComp, label) => {
				const options = gamesByComp.map(({ _id, date, teamNames }) => {
					return { value: _id, label: `${date.toString("ddd dS MMM")} - ${teamNames}` };
				});
				return { label, options };
			})
			.value();

		return { isLoading: false, socialProfileAsOptions, gamesThisWeek, gamesAsOptions };
	}

	getInitialValues(): IWeeklyPostFields {
		const { settings } = this.props;
		const { gamesThisWeek, socialProfileAsOptions } = this.state;

		const text = `${settings.weeklyPost.defaultTweetText}\n\n${settings.googleForm.link}`;
		const games = gamesThisWeek.filter(g => g.includeInWeeklyPost).map(g => g._id);

		return {
			_profile: socialProfileAsOptions[0].value,
			games,
			text,
			postToFacebook: true
		};
	}

	getFieldGroups(values: IWeeklyPostFields): IFieldGroup<IWeeklyPostFields>[] {
		const { previewWeeklyPostImage, socialProfiles, settings } = this.props;
		const { gamesAsOptions, socialProfileAsOptions } = this.state;

		//Get variables for tweet composer
		const variables = [{ label: "Google Form", value: settings.googleForm.link }];

		//Hide facebook if the profile doesn't have an IFTTT key
		let hideFacebook = false;
		if (socialProfiles && !socialProfiles[values._profile].ifttt_key) {
			hideFacebook = true;
		}

		return [
			{
				fields: [
					{
						name: "_profile",
						type: FormFieldTypes.select,
						options: socialProfileAsOptions,
						hide: socialProfileAsOptions.length === 1
					},
					{
						name: "games",
						type: FormFieldTypes.select,
						isMulti: true,
						options: gamesAsOptions,
						isClearable: true,
						closeMenuOnSelect: false
					},
					{ name: "text", type: FormFieldTypes.tweet, variables },
					{
						name: "postToFacebook",
						type: FormFieldTypes.boolean,
						hide: hideFacebook
					}
				]
			},
			{
				label: "Preview Image",
				render: values => (
					<ServerContentPreview
						//allowReloading={false}
						disabled={values.games.length === 0}
						getData={() => previewWeeklyPostImage(values.games)}
						key={"preview"}
						renderContent={"image"}
					/>
				)
			}
		];
	}

	render() {
		const { submitWeeklyPost } = this.props;
		const { gamesThisWeek, isLoading, validationSchema } = this.state;

		//Otherwise if we're still waiting on things, show a loading spinner
		if (isLoading) {
			return <LoadingPage />;
		}

		//In case we have no games
		if (!gamesThisWeek.length) {
			return (
				<div className="card">
					<h6>No games to display</h6>
					<p>There are no games this week so a weekly post cannot be created.</p>
				</div>
			);
		}

		//Get Header
		const header = "Submit Weekly Post";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<h1>{header}</h1>
					<BasicForm<IWeeklyPostFields>
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isInitialValid={true}
						isNew={true}
						itemType={"Game Post"}
						onSubmit={submitWeeklyPost}
						submitButtonText={"Submit Post"}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const WeeklyPostPage = connector(_WeeklyPostPage);
