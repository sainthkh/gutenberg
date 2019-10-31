/**
 * External dependencies
 */
import { noop, get } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { DotTip } from '@wordpress/nux';

/**
 * Internal dependencies
 */
import EntitiesSavedStates from '../entities-saved-states';
import PublishButtonLabel from './label';

export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );
		this.buttonNode = createRef();

		this.createOnClick = this.createOnClick.bind( this );
		this.closeEntitiesSavedStates = this.closeEntitiesSavedStates.bind( this );

		this.state = {
			entitiesSavedStatesCallback: false,
		};
	}
	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.buttonNode.current.focus();
		}
	}

	createOnClick( callback ) {
		return ( ...args ) => {
			const { hasNonPostEntityChanges } = this.props;
			if ( hasNonPostEntityChanges ) {
				return this.setState( {
					entitiesSavedStatesCallback: () => callback( ...args ),
				} );
			}

			return callback( ...args );
		};
	}

	closeEntitiesSavedStates( savedById ) {
		const { postType, postId } = this.props;
		const { entitiesSavedStatesCallback } = this.state;
		this.setState( { entitiesSavedStatesCallback: false }, () => {
			if ( savedById[ `postType | ${ postType } | ${ postId }` ] ) {
				entitiesSavedStatesCallback();
			}
		} );
	}

	render() {
		const {
			forceIsDirty,
			forceIsSaving,
			hasPublishAction,
			isBeingScheduled,
			isOpen,
			isPostSavingLocked,
			isPublishable,
			isPublished,
			isSaveable,
			isSaving,
			isToggle,
			onSave,
			onStatusChange,
			onSubmit = noop,
			onToggle,
			visibility,
			hasNonPostEntityChanges,
		} = this.props;
		const {
			entitiesSavedStatesCallback,
		} = this.state;

		const isButtonDisabled =
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			isPostSavingLocked ||
			( ! isPublishable && ! forceIsDirty );

		const isToggleDisabled =
			isPublished ||
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			( ! isPublishable && ! forceIsDirty );

		let publishStatus;
		if ( ! hasPublishAction ) {
			publishStatus = 'pending';
		} else if ( isBeingScheduled ) {
			publishStatus = 'future';
		} else if ( visibility === 'private' ) {
			publishStatus = 'private';
		} else {
			publishStatus = 'publish';
		}

		const onClickButton = () => {
			if ( isButtonDisabled ) {
				return;
			}
			onSubmit();
			onStatusChange( publishStatus );
			onSave();
		};

		const onClickToggle = () => {
			if ( isToggleDisabled ) {
				return;
			}
			onToggle();
		};

		const buttonProps = {
			'aria-disabled': isButtonDisabled,
			className: 'editor-post-publish-button',
			isBusy: isSaving && isPublished,
			isPrimary: true,
			onClick: this.createOnClick( onClickButton ),
		};

		const toggleProps = {
			'aria-disabled': isToggleDisabled,
			'aria-expanded': isOpen,
			className: 'editor-post-publish-panel__toggle',
			isBusy: isSaving && isPublished,
			isPrimary: true,
			onClick: this.createOnClick( onClickToggle ),
		};

		const toggleChildren = isBeingScheduled ? __( 'Schedule…' ) : __( 'Publish…' );
		const buttonChildren = <PublishButtonLabel forceIsSaving={ forceIsSaving } />;

		const componentProps = isToggle ? toggleProps : buttonProps;
		const componentChildren = isToggle ? toggleChildren : buttonChildren;
		return (
			<div>
				<EntitiesSavedStates
					isOpen={ Boolean( entitiesSavedStatesCallback ) }
					onRequestClose={ this.closeEntitiesSavedStates }
				/>
				<Button
					isLarge
					ref={ this.buttonNode }
					{ ...componentProps }
					className={ classnames( componentProps.className, {
						'editor-post-publish-button__has-changes-dot': hasNonPostEntityChanges,
					} ) }
				>
					{ componentChildren }
				</Button>
				{ /* Todo: Remove the wrapping div when DotTips are removed. */ }
				<DotTip tipId="core/editor.publish">
					{ __( 'Finished writing? That’s great, let’s get this published right now. Just click “Publish” and you’re good to go.' ) }
				</DotTip>
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isEditedPostBeingScheduled,
			getEditedPostVisibility,
			isCurrentPostPublished,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isPostSavingLocked,
			getCurrentPost,
			getCurrentPostType,
			getCurrentPostId,
			hasNonPostEntityChanges,
		} = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			visibility: getEditedPostVisibility(),
			isSaveable: isEditedPostSaveable(),
			isPostSavingLocked: isPostSavingLocked(),
			isPublishable: isEditedPostPublishable(),
			isPublished: isCurrentPostPublished(),
			hasPublishAction: get( getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			hasNonPostEntityChanges: hasNonPostEntityChanges(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( 'core/editor' );
		return {
			onStatusChange: ( status ) => editPost( { status }, { undoIgnore: true } ),
			onSave: savePost,
		};
	} ),
] )( PostPublishButton );