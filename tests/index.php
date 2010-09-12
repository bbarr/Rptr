<?php 
	$test_name = $_GET['test'];
	$tests = array('events');
?>

<!DOCTYPE HTML>

<html>
<head>
	
	<!-- QUNIT SOURCE FILES -->
	<link rel="stylesheet" type="text/css" href="/unit_testing/src/qunit.css" />
	<script type="text/javascript" src="/unit_testing/src/qunit.js"></script>
	
	<!-- TEST DEPENDENCIES -->
	<script type="text/javascript" src="/src/raptor.js"></script>
	
	<!-- TEST -->
	<?php if ($test_name) : ?>
		<script id="test-script" type="text/javascript" src="/unit_testing/specs/<?php echo $test_name; ?>.js"></script>
	<?php endif; ?>
	
	<script type="text/javascript">
		
		var init = function() {	
			
			var select = document.getElementById('test-select');
			var script = document.getElementById('test-script');
			
			var select_test = function(test) {
				var current = window.location.href;
				var query = '?test=' + test;
				destination = (current.indexOf('?') > -1) ? current.replace(/\?.+/, query) : current + query;
				if (current !== destination) window.location = destination;
			}

			// change script
			select.onchange = function(e) {
				select_test(e.target.value);
			}
			
			// init
			if (!script) select_test(select.value);
		};
		
		window.onload = init;
		
	</script>
	
	<style type="text/css">
		#test-select-container {
			padding: 10px;
			font-size:18px;
			font-weight:bold;
		}
		#test-select {
			border: 1px solid #555;
			padding: 1px;
			width: 200px;
			margin-left: 5px;
		}
		
	</style>
	
</head>
<body>
	<div id="test-select-container">
		<label>Select Test: </label>
		<select id="test-select">
			<?php 
				foreach ($tests as $test) {
					$selected = ($test == $test_name) ? 'selected' : '';
					echo "<option value='$test' $selected>$test</option>";
				} 
			?>
		</select>
	</div>
	<h1 id="qunit-header">QUnit example</h1>
	<h2 id="qunit-banner"></h2>
	<h2 id="qunit-userAgent"></h2>
	<ol id="qunit-tests"></ol>
	<div id="qunit-fixture">test markup, will be hidden</div>
</body>
</html>