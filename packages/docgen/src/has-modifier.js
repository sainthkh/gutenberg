const { Statement, SyntaxKind } = require( 'typescript' );

/**
 *
 * @param {Statement} statement
 */
function hasExportModifier( statement ) {
	if ( statement.modifiers ) {
		return (
			statement.modifiers.filter(
				( modifier ) => modifier.kind === SyntaxKind.ExportKeyword
			).length > 0
		);
	}

	return false;
}

/**
 *
 * @param {Statement} statement
 */
function hasDefaultModifier( statement ) {
	if ( statement.modifiers ) {
		return (
			statement.modifiers.filter(
				( modifier ) => modifier.kind === SyntaxKind.DefaultKeyword
			).length > 0
		);
	}

	return false;
}

module.exports = {
	hasExportModifier,
	hasDefaultModifier,
};