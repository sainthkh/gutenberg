/**
 * WordPress dependencies
 */
import { useEffect, useCallback, useState, useRef } from '@wordpress/element';

export default function useDragging( { onDragStart, onDragMove, onDragEnd } ) {
	const [ isDragging, setIsDragging ] = useState( false );

	const eventsRef = useRef( {
		onDragStart,
		onDragMove,
		onDragEnd,
	} );
	useEffect(
		() => {
			eventsRef.current.onDragStart = onDragStart;
			eventsRef.current.onDragMove = onDragMove;
			eventsRef.current.onDragEnd = onDragEnd;
		},
		[ onDragStart, onDragMove, onDragEnd ]
	);

	const startDrag = useCallback( ( ...args ) => {
		if ( eventsRef.current.onDragEnd ) {
			eventsRef.current.onDragStart( ...args );
		}
		setIsDragging( true );
	} );
	const onMouseMove = useCallback( ( ...args ) => ( eventsRef.current.onDragMove && eventsRef.current.onDragMove( ...args ) ) );
	const endDrag = useCallback( ( ...args ) => {
		if ( eventsRef.current.onDragEnd ) {
			eventsRef.current.onDragEnd( ...args );
		}
		setIsDragging( false );
	} );

	useEffect( () => {
		if ( isDragging ) {
			document.addEventListener( 'mousemove', onMouseMove );
			document.addEventListener( 'mouseup', endDrag );
		}

		return () => {
			document.removeEventListener( 'mousemove', onMouseMove );
			document.removeEventListener( 'mouseup', endDrag );
		};
	}, [ isDragging ] );
	return {
		startDrag,
		endDrag,
		isDragging,
	};
}
