<?php 

$allowURL = array('peercc-server.ortclib.org');
if($_GET['url']){


$url = urldecode($_GET['url']);

	if(in_array(parse_url($url, PHP_URL_HOST), $allowURL) === true){
		if(substr($url, strrpos($url, "/") + 1) != null){

		$ch = curl_init();

		curl_setopt_array($ch, array(
		    CURLOPT_RETURNTRANSFER => true,
		    CURLOPT_URL => $url,
		    CURLOPT_HEADER => true,
		    CURLOPT_FOLLOWLOCATION => true,
		));

		if($_SERVER["REQUEST_METHOD"] == "POST"){
			curl_setopt( $ch, CURLOPT_POST, true);
			$postData = file_get_contents("php://input");
			curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
		}

		list( $headers, $result ) = preg_split( '/([\r\n][\r\n])\\1/', curl_exec( $ch ) );

		$status = curl_getinfo( $ch );


		curl_close($ch);

		$header_text = preg_split( '/[\r\n]+/', $headers );

		foreach ( $header_text as $header ) {
    		if ( preg_match( 
    			'/^(?:content-type|pragma|connection|access-control-expose-headers|access-control-allow-origin|server|access-control-allow-headers):/i', $header ) ) {
			  header( $header );
			}
		}
		
		print $result;
		
		}
	}
	else
		print("Wrong server!");

}


 ?>