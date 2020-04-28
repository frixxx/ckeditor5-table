/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, window, document */

import { createTableAsciiArt, modelTable, prepareModelTableInput, prettyFormatModelTableInput } from '../_utils/utils';

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

import { diffString } from 'json-diff';
import ArticlePluginSet from '@ckeditor/ckeditor5-core/tests/_utils/articlepluginset';

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ ArticlePluginSet ],
		toolbar: [
			'insertTable', 'undo', 'redo'
		],
		table: {
			contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
		}
	} )
	.then( editor => {
		window.editor = editor;

		const asciiOut = document.getElementById( 'ascii-art' );
		const modelData = document.getElementById( 'model-data' );

		document.getElementById( 'clear-content' ).addEventListener( 'click', () => {
			editor.setData( '' );
		} );

		document.getElementById( 'set-model-data' ).addEventListener( 'click', () => {
			const inputModelData = parseModelData( modelData.value );
			setModelData( editor.model, inputModelData ? modelTable( inputModelData ) : '' );
		} );

		document.getElementById( 'get-model-data' ).addEventListener( 'click', () => {
			const table = findTable( editor );
			const data = prepareModelTableInput( table );

			modelData.value = prettyFormatModelTableInput( data );

			updateAsciiAndDiff();
		} );

		editor.model.document.on( 'change:data', updateAsciiAndDiff );
		updateAsciiAndDiff();

		function updateAsciiAndDiff() {
			const table = findTable( editor );

			if ( !table ) {
				asciiOut.innerText = '-- table not found --';
				return;
			}

			const inputModelData = parseModelData( modelData.value );
			const currentModelData = prepareModelTableInput( table );

			const diffOutput = inputModelData ? diffString( inputModelData, currentModelData, {
				theme: {
					' ': string => string,
					'+': string => `<span class="diff-add">${ string }</span>`,
					'-': string => `<span class="diff-del">${ string }</span>`
				}
			} ) : '-- no input --';

			asciiOut.innerHTML = createTableAsciiArt( table ) + '\n\n' +
				'Diff: input vs post-fixed model:\n' + ( diffOutput ? diffOutput : '-- no differences --' );
		}

		function findTable( editor ) {
			const range = editor.model.createRangeIn( editor.model.document.getRoot() );

			for ( const element of range.getItems() ) {
				if ( element.is( 'table' ) ) {
					return element;
				}
			}

			return null;
		}

		function parseModelData( string ) {
			return eval( `(${ string.trim() || 'null' })` ); // eslint-disable-line no-eval
		}
	} )
	.catch( err => {
		console.error( err.stack );
	} );
