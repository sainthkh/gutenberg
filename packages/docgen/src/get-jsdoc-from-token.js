/**
 * External dependencies.
 */
const parse = require( 'comment-parser' );

/**
 * Internal dependencies.
 */
const getLeadingComments = require( './get-leading-comments' );
const getTypeAsString = require( './get-type-as-string' );

/**
 * Function that takes an Espree token and returns
 * a object representing the leading JSDoc comment of the token,
 * if any.
 *
 * @param {Object} token Espree token.
 * @return {Object} Object representing the JSDoc comment.
 */
module.exports = function( token ) {
	let jsdoc;
	let comments = getLeadingComments( token );
	if ( comments && /^\*\r?\n/.test( comments ) ) {
		comments = encodeTabsInCode( comments );

		// babel strips /* and */, but comment-parser requires it.
		jsdoc = parse( `/*${ comments }\n*/` )[ 0 ];

		delete jsdoc.line;
		delete jsdoc.source;

		jsdoc.tags = jsdoc.tags.map(
			( { tag: title, name, type, description, optional } ) => {
				const mergeNameAndDesc = () =>
					`${ name } ${ description }`.trim();

				if ( title === 'deprecated' || title === 'see' ) {
					return {
						title,
						description: mergeNameAndDesc(),
					};
				}

				if ( title === 'since' ) {
					return {
						title,
						version: name,
						description,
					};
				}

				if ( title === 'param' ) {
					return {
						title,
						name,
						description,
						type: getTypeAsString( type, optional ),
					};
				}

				if ( title === 'return' ) {
					return {
						title,
						description: mergeNameAndDesc(),
						type: getTypeAsString( type, optional ),
					};
				}

				if ( title === 'type' ) {
					return {
						title,
						description: null,
						type: getTypeAsString( type, optional ),
					};
				}

				if ( title === 'example' ) {
					return {
						title,
						description: decodeTabsInCode(
							`${ name }\n${ description }`
						),
					};
				}

				return {
					title,
					description,
				};
			}
		);
	}
	return jsdoc;
};

const codeRegex = /```.*\n[\s\S]*```/g;
const CODE_TAB = '__CODE_TAB__';

const encodeTabsInCode = ( comments ) => {
	return comments.replace( codeRegex, ( m0 ) => {
		return m0.replace( / \* \t+/g, ( m1 ) => {
			return m1.replace( /\t/g, CODE_TAB );
		} );
	} );
};

const decodeTabsInCode = ( description ) => {
	return description.replace( codeRegex, ( m0 ) => {
		return m0.replace( new RegExp( CODE_TAB, 'g' ), '\t' );
	} );
};
