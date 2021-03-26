//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { ServerContentPreview } from "~/client/components/forms/ServerContentPreview";

//Actions
import { fetchGameForImagePost, previewSingleGameImage, submitSingleGameImagePost } from "~/client/actions/gameActions";
import { fetchAllSocialProfiles } from "~/client/actions/socialActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IGameForImagePost, ISingleGamePostFields } from "~/models/Game";
import { FormFieldTypes, IFieldGroup, SelectOption } from "~/enum/FormFieldTypes";
import { gameVariableMap, parseGameVariablesForPost } from "~/helpers/gameHelper";
import { ISettings } from "~/models/Settings";
import { yupTweetValidator } from "~/helpers/formHelper";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	show404: boolean;
	game?: IGameForImagePost;
	socialProfileAsOptions: SelectOption[];
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ config, socialProfiles }: StoreState) {
	const { settings } = config;
	return { settings: settings as ISettings, socialProfiles };
}
const mapDispatchToProps = {
	fetchGameForImagePost,
	fetchAllSocialProfiles,
	previewSingleGameImage,
	submitSingleGameImagePost
};
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GamePostPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { socialProfiles, fetchAllSocialProfiles, fetchGameForImagePost, match } = props;

		//Ensure we have social profiles
		if (!socialProfiles) {
			fetchAllSocialProfiles();
		}

		const validationSchema = Yup.object().shape({
			_id: Yup.string().required(),
			_profile: Yup.string().required().label("Social Profile"),
			text: yupTweetValidator().label("Text"),
			postToFacebook: Yup.boolean().label("Post to Facebook?")
		});

		this.state = {
			socialProfileAsOptions: [],
			show404: false,
			validationSchema
		};

		//Get the game. It's formatted differently to the usual redux entry so we call it on each page load
		fetchGameForImagePost(match.params._id).then(game => {
			if (game) {
				this.setState({ game });
			} else {
				this.setState({ show404: true });
			}
		});
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { socialProfiles } = nextProps;

		if (socialProfiles && !prevState.socialProfileAsOptions.length) {
			const socialProfileAsOptions = _.chain(socialProfiles)
				.sortBy(({ isDefault, name }) => `${isDefault ? 0 : 1}${name.toLowerCase()}`)
				.map(profile => ({
					label: `${profile.name}${profile.isDefault ? " (Default)" : ""}`,
					value: profile._id
				}))
				.value();
			return { socialProfileAsOptions };
		}

		return null;
	}

	getInitialValues(): ISingleGamePostFields {
		const { settings } = this.props;
		const { socialProfileAsOptions } = this.state;
		const game = this.state.game as IGameForImagePost;

		const text = parseGameVariablesForPost(game, settings.singleGamePost.defaultTweetText, settings);

		return {
			_id: game._id,
			_profile: socialProfileAsOptions[0].value,
			text,
			postToFacebook: true
		};
	}

	getFieldGroups(values: ISingleGamePostFields): IFieldGroup<ISingleGamePostFields>[] {
		const { socialProfiles, settings } = this.props;
		const { game, socialProfileAsOptions } = this.state;

		//Get variables for tweet composer
		const variables = _.map(gameVariableMap, obj => {
			return {
				label: obj.description,
				value: obj.getValue(game as IGameForImagePost, settings)
			};
		});

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
					{ name: "text", type: FormFieldTypes.tweet, variables },
					{
						name: "postToFacebook",
						type: FormFieldTypes.boolean,
						hide: hideFacebook
					}
				]
			}
		];
	}

	renderImagePreview() {
		const { match, previewSingleGameImage } = this.props;

		return (
			<div className="card form-card">
				<h6>Preview Image</h6>
				<ServerContentPreview
					allowReloading={false}
					getData={() => previewSingleGameImage(match.params._id)}
					renderContent={"image"}
				/>
			</div>
		);
	}

	render() {
		const { submitSingleGameImagePost } = this.props;
		const { game, show404, socialProfileAsOptions, validationSchema } = this.state;

		//If we've explicitly set the game to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Game not found" />;
		}

		//Otherwise if we're still waiting on things, show a loading spinner
		if (!game || !socialProfileAsOptions.length) {
			return <LoadingPage />;
		}

		//Get Header
		const header = "Submit Game Post";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/games/${game._id}`}>Return to edit game</NavCard>
					<h1>{header}</h1>
					<BasicForm<ISingleGamePostFields>
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isInitialValid={true}
						isNew={true}
						itemType={"Game Post"}
						onSubmit={submitSingleGameImagePost}
						submitButtonText={"Submit Post"}
						validationSchema={validationSchema}
					/>
					{this.renderImagePreview()}
				</div>
			</section>
		);
	}
}

export const GamePostPage = connector(_GamePostPage);
