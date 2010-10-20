<?php 
	
	$test_name = $_GET['test'];
	
	// Generate an array of the spec's available to test
	$tests = Array();
	$handle = opendir('specs');
	while (false !== ($file = readdir($handle))) {
		if ($file === '.' || $file === '..') continue;
		$tests[] = substr($file, 0, strpos($file, '.js'));
	}
?>

<!DOCTYPE HTML>

<html>
<head>
	
	<!-- QUNIT SOURCE FILES -->
	<link rel="stylesheet" type="text/css" href="/tests/src/qunit.css" />
	<script type="text/javascript" src="/tests/src/qunit.js"></script>
	
	<!-- TEST DEPENDENCIES -->
	<script type="text/javascript" src="/src/raptor.js"></script>
	
	<script type="text/javascript">
		
		raptor.set_script_path('/spend-analyzer/prototype/scripts/');
		
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
				var target;
				if (e) target = e.target;
				else target = window.event.srcElement;
				select_test(target.value);
			}
			
			// init
			if (!script) select_test(select.value);
		};
		
		window.onload = init;
		
	</script>
	
	<!-- TEST -->
	<?php if ($test_name) : ?>
		<script id="test-script" type="text/javascript" src="/tests/specs/<?php echo $test_name; ?>.js"></script>
	<?php endif; ?>
	
</head>
<body>
	<select id="test-select">
		<?php 
			foreach ($tests as $test) {
				$selected = ($test == $test_name) ? 'selected' : '';
				echo "<option value='$test' $selected>$test</option>";
			} 
		?>
	</select>
	<h1 id="qunit-header">QUnit example</h1>
	<h2 id="qunit-banner"></h2>
	<h2 id="qunit-userAgent"></h2>
	<ol id="qunit-tests"></ol>
	<div id="qunit-fixture">test markup, will be hidden</div>
</body>
</html>
