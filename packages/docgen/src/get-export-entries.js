/**
 * External dependencies
 */
const ts = require( 'typescript' );
const { SyntaxKind } = ts;

const { hasExportKeyword, hasDefaultKeyword } = require( './has-keyword' );

/**
 * Returns the export entry records of the given export statement.
 * Unlike [the standard](http://www.ecma-international.org/ecma-262/9.0/#exportentry-record),
 * the `importName` and the `localName` are merged together.
 *
 * @param {Object} statement TypeScript AST node representing an export.
 *
 * @return {Array} Exported entry records. Example:
 * [ {
 *    localName: 'localName',
 *    exportName: 'exportedName',
 *    module: null,
 * } ]
 */
module.exports = function( statement ) {
	if ( hasExportKeyword( statement ) ) {
		if ( hasDefaultKeyword( statement ) ) {
			const getLocalName = ( s ) => {
				switch ( s.kind ) {
					case SyntaxKind.ClassDeclaration:
					case SyntaxKind.FunctionDeclaration:
					default:
						return s.name ? s.name.escapedText : '*default*';
				}
			};

			return [
				{
					localName: getLocalName( statement ),
					exportName: 'default',
					module: null,
				},
			];
		}

		if ( statement.kind === SyntaxKind.VariableStatement ) {
			return statement.declarationList.declarations.map( ( decl ) => {
				return {
					localName: decl.name.escapedText,
					exportName: decl.name.escapedText,
					module: null,
				};
			} );
		}

		return [
			{
				localName: statement.name.escapedText,
				exportName: statement.name.escapedText,
				module: null,
			},
		];
	}

	if ( statement.kind === SyntaxKind.ExportAssignment ) {
		const getLocalName = ( s ) => {
			switch ( s.expression.kind ) {
				case SyntaxKind.Identifier:
					return s.expression.escapedText;
				default:
					return '*default*';
			}
		};

		return [
			{
				localName: getLocalName( statement ),
				exportName: 'default',
				module: null,
			},
		];
	}

	// statement.kind === SyntaxKind.ExportDeclaration

	return statement.exportClause
		? // export { a, b } from './module'
		  statement.exportClause.elements.map( ( element ) => {
				return {
					localName: element.propertyName
						? element.propertyName.escapedText
						: element.name.escapedText,
					exportName: element.name.escapedText,
					module: statement.moduleSpecifier
						? statement.moduleSpecifier.text
						: null,
				};
		  } )
		: // export * from './namespace-module';
		  [
				{
					localName: '*',
					exportName: null,
					module: statement.moduleSpecifier.text,
				},
		  ];
};
