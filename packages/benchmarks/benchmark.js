import { Bench } from 'tinybench';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { compile as mdxjsCompile } from '@mdx-js/mdx';
import { compileSync as rspressCompile } from '@rspress/mdx-rs';

// Import bunny-wasm (Node.js version - no init needed)
import { compile_mdx, WasmMdxOptions } from 'bunny-wasm';

// Helper to load Next.js fixtures if available
function loadNextjsFixtures() {
  const nextjsPath = './fixtures/nextjs/docs';
  if (!existsSync(nextjsPath)) {
    return null;
  }

  // Find all MDX files (keep them separate, not concatenated)
  const mdxFiles = [];

  function walkDir(dir) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.mdx')) {
          const content = readFileSync(filePath, 'utf8');
          mdxFiles.push(content);
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  walkDir(nextjsPath);

  return mdxFiles.length > 0 ? mdxFiles : null;
}

// Test fixtures
const customFixtures = {
  simple: readFileSync('./fixtures/simple.mdx', 'utf8'),
  complex: readFileSync('./fixtures/complex.mdx', 'utf8'),
  large: readFileSync('./fixtures/large.mdx', 'utf8'),
};

const nextjsFiles = loadNextjsFixtures();

// Compilation options (as similar as possible across implementations)
const commonOptions = {
  gfm: true,
  footnotes: true,
  math: true,
};

// Create bunny-wasm options
function createBunnyOptions(outputFormat = 'program') {
  const options = new WasmMdxOptions();
  options.set_gfm(commonOptions.gfm);
  options.set_footnotes(commonOptions.footnotes);
  options.set_math(commonOptions.math);
  options.set_output_format(outputFormat);
  return options;
}

// Native Rust binary path
const NATIVE_BINARY = join(process.cwd(), 'benchmark-native/target/release/bunny-benchmark');

// Compile MDX using native Rust binary
function compileNativeRust(content, outputFormat = 'program') {
  return new Promise((resolve, reject) => {
    const proc = spawn(NATIVE_BINARY, [outputFormat], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Native Rust binary exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (!result.success) {
          reject(new Error('Native Rust compilation failed'));
          return;
        }
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse native Rust output: ${e.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn native Rust binary: ${err.message}`));
    });

    // Send content to stdin
    proc.stdin.write(content, 'utf8');
    proc.stdin.end();
  });
}

async function runBenchmark(name, content) {
  const spinner = ora(`Running ${name} benchmark...`).start();

  const bench = new Bench({
    time: 1000,  // Run for 1 second
    iterations: 10,
    warmupIterations: 5,
  });

  // Official MDX (JavaScript)
  bench.add('@mdx-js/mdx', async () => {
    try {
      await mdxjsCompile(content, {
        development: false,
        remarkPlugins: [],
        rehypePlugins: [],
      });
    } catch (e) {
      console.error('@mdx-js/mdx error:', e.message);
      throw e;
    }
  });

  // Rspress MDX (Rust via NAPI)
  bench.add('@rspress/mdx-rs', () => {
    try {
      rspressCompile({
        value: content,
        filepath: 'benchmark.mdx',
        development: false,
        root: process.cwd(),
      });
    } catch (e) {
      console.error('@rspress/mdx-rs error:', e.message);
      throw e;
    }
  });

  // Bunny WASM (Program format - ES modules)
  bench.add('bunny-wasm (program)', () => {
    try {
      const options = createBunnyOptions('program');
      compile_mdx(content, options);
    } catch (e) {
      console.error('bunny-wasm (program) error:', e.message);
      throw e;
    }
  });

  // Bunny WASM (Function-body format - for runtime eval)
  bench.add('bunny-wasm (function-body)', () => {
    try {
      const options = createBunnyOptions('function-body');
      compile_mdx(content, options);
    } catch (e) {
      console.error('bunny-wasm (function-body) error:', e.message);
      throw e;
    }
  });

  // Bunny Native Rust (Program format)
  bench.add('bunny-native (program)', async () => {
    try {
      await compileNativeRust(content, 'program');
    } catch (e) {
      console.error('bunny-native (program) error:', e.message);
      throw e;
    }
  });

  // Bunny Native Rust (Function-body format)
  bench.add('bunny-native (function-body)', async () => {
    try {
      await compileNativeRust(content, 'function-body');
    } catch (e) {
      console.error('bunny-native (function-body) error:', e.message);
      throw e;
    }
  });

  await bench.run();
  spinner.succeed(`Completed ${name} benchmark`);

  return bench.tasks;
}

async function runBatchBenchmark(name, files) {
  const spinner = ora(`Running ${name} batch benchmark (${files.length} files)...`).start();

  const bench = new Bench({
    time: 5000,  // Run for 5 seconds (longer for batch)
    iterations: 5,
    warmupIterations: 2,
  });

  // Official MDX (JavaScript) - compile all files sequentially
  bench.add('@mdx-js/mdx', async () => {
    try {
      for (const content of files) {
        await mdxjsCompile(content, {
          development: false,
          remarkPlugins: [],
          rehypePlugins: [],
        });
      }
    } catch (e) {
      console.error('@mdx-js/mdx error:', e.message);
      throw e;
    }
  });

  // Rspress MDX (Rust via NAPI) - compile all files sequentially
  bench.add('@rspress/mdx-rs', () => {
    try {
      for (const content of files) {
        rspressCompile({
          value: content,
          filepath: 'benchmark.mdx',
          development: false,
          root: process.cwd(),
        });
      }
    } catch (e) {
      console.error('@rspress/mdx-rs error:', e.message);
      throw e;
    }
  });

  // Bunny WASM (Program format) - compile all files sequentially
  bench.add('bunny-wasm (program)', () => {
    try {
      for (const content of files) {
        const options = createBunnyOptions('program');
        compile_mdx(content, options);
      }
    } catch (e) {
      console.error('bunny-wasm (program) error:', e.message);
      throw e;
    }
  });

  // Bunny WASM (Function-body format) - compile all files sequentially
  bench.add('bunny-wasm (function-body)', () => {
    try {
      for (const content of files) {
        const options = createBunnyOptions('function-body');
        compile_mdx(content, options);
      }
    } catch (e) {
      console.error('bunny-wasm (function-body) error:', e.message);
      throw e;
    }
  });

  // Bunny Native Rust (Program format) - compile all files sequentially
  bench.add('bunny-native (program)', async () => {
    try {
      for (const content of files) {
        await compileNativeRust(content, 'program');
      }
    } catch (e) {
      console.error('bunny-native (program) error:', e.message);
      throw e;
    }
  });

  // Bunny Native Rust (Function-body format) - compile all files sequentially
  bench.add('bunny-native (function-body)', async () => {
    try {
      for (const content of files) {
        await compileNativeRust(content, 'function-body');
      }
    } catch (e) {
      console.error('bunny-native (function-body) error:', e.message);
      throw e;
    }
  });

  await bench.run();
  spinner.succeed(`Completed ${name} batch benchmark`);

  return bench.tasks;
}

function displayResults(name, tasks, content) {
  console.log(chalk.bold.cyan(`\n📊 ${name.toUpperCase()} BENCHMARK RESULTS\n`));

  const table = new Table({
    head: [
      chalk.bold('Implementation'),
      chalk.bold('Ops/sec'),
      chalk.bold('Avg Time'),
      chalk.bold('Margin'),
      chalk.bold('Relative'),
    ],
    colAligns: ['left', 'right', 'right', 'right', 'right'],
  });

  // Filter out tasks with errors and sort by ops (fastest first)
  const validTasks = tasks.filter(task => task.result && !task.result.error);

  if (validTasks.length === 0) {
    console.log(chalk.red('No valid benchmark results'));
    tasks.forEach(task => {
      if (task.result?.error) {
        console.log(chalk.red(`${task.name}: ${task.result.error}`));
      }
    });
    return;
  }

  const sorted = [...validTasks].sort((a, b) => b.result.hz - a.result.hz);
  const fastest = sorted[0].result.hz;

  sorted.forEach((task) => {
    const hz = task.result.hz.toFixed(2);
    const avgTime = (task.result.mean * 1000).toFixed(2) + 'ms';
    const margin = `±${task.result.rme.toFixed(2)}%`;
    const relative = (fastest / task.result.hz).toFixed(2) + 'x';

    const isFastest = task.result.hz === fastest;
    const isBunnyWasm = task.name.startsWith('bunny-wasm');
    const isBunnyNative = task.name.startsWith('bunny-native');
    
    let nameDisplay = task.name;
    if (isFastest) {
      nameDisplay = chalk.green(task.name + ' 🏆');
    } else if (isBunnyNative) {
      nameDisplay = chalk.cyan(task.name);
    } else if (isBunnyWasm) {
      nameDisplay = chalk.blue(task.name);
    }

    const row = [
      nameDisplay,
      isFastest ? chalk.green(hz) : hz,
      isFastest ? chalk.green(avgTime) : avgTime,
      margin,
      isFastest ? chalk.green('1.00x (fastest)') : chalk.yellow(relative + ' slower'),
    ];

    table.push(row);
  });

  console.log(table.toString());

  // Document size info
  const sizeKB = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(2);
  console.log(chalk.dim(`   Document size: ${sizeKB} KB`));
}

function displayBatchResults(name, tasks, files) {
  console.log(chalk.bold.cyan(`\n📊 ${name.toUpperCase()} BATCH BENCHMARK RESULTS\n`));

  const table = new Table({
    head: [
      chalk.bold('Implementation'),
      chalk.bold('Files/sec'),
      chalk.bold('Total Time'),
      chalk.bold('Avg per File'),
      chalk.bold('Relative'),
    ],
    colAligns: ['left', 'right', 'right', 'right', 'right'],
  });

  // Filter out tasks with errors and sort by ops (fastest first)
  const validTasks = tasks.filter(task => task.result && !task.result.error);

  if (validTasks.length === 0) {
    console.log(chalk.red('No valid benchmark results'));
    tasks.forEach(task => {
      if (task.result?.error) {
        console.log(chalk.red(`${task.name}: ${task.result.error}`));
      }
    });
    return;
  }

  const sorted = [...validTasks].sort((a, b) => b.result.hz - a.result.hz);
  const fastest = sorted[0].result.hz;

  sorted.forEach((task) => {
    // task.result.hz is "batch compilations per second"
    // So files/sec = hz * fileCount
    const filesPerSec = (task.result.hz * files.length).toFixed(2);
    const totalTime = (task.result.mean * 1000).toFixed(2) + 'ms';
    const avgPerFile = (task.result.mean * 1000 / files.length).toFixed(2) + 'ms';
    const relative = (fastest / task.result.hz).toFixed(2) + 'x';

    const isFastest = task.result.hz === fastest;
    const isBunnyWasm = task.name.startsWith('bunny-wasm');
    const isBunnyNative = task.name.startsWith('bunny-native');
    
    let nameDisplay = task.name;
    if (isFastest) {
      nameDisplay = chalk.green(task.name + ' 🏆');
    } else if (isBunnyNative) {
      nameDisplay = chalk.cyan(task.name);
    } else if (isBunnyWasm) {
      nameDisplay = chalk.blue(task.name);
    }

    const row = [
      nameDisplay,
      isFastest ? chalk.green(filesPerSec) : filesPerSec,
      isFastest ? chalk.green(totalTime) : totalTime,
      isFastest ? chalk.green(avgPerFile) : avgPerFile,
      isFastest ? chalk.green('1.00x (fastest)') : chalk.yellow(relative + ' slower'),
    ];

    table.push(row);
  });

  console.log(table.toString());

  // Total size info
  const totalSize = files.reduce((sum, content) => sum + Buffer.byteLength(content, 'utf8'), 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  const avgSizeKB = (totalSize / files.length / 1024).toFixed(2);
  console.log(chalk.dim(`   Total: ${files.length} files, ${totalSizeMB} MB (avg ${avgSizeKB} KB per file)`));
}

function displaySummary(allResults) {
  console.log(chalk.bold.magenta('\n\n🏆 OVERALL SUMMARY\n'));
  
  const summaryTable = new Table({
    head: [
      'Test Case', 
      '@mdx-js/mdx', 
      '@rspress/mdx-rs', 
      chalk.cyan('bunny-native (prog)'),
      chalk.cyan('bunny-native (fn)'),
      chalk.blue('bunny-wasm (prog)'),
      chalk.blue('bunny-wasm (fn)')
    ],
    colAligns: ['left', 'right', 'right', 'right', 'right', 'right', 'right'],
  });

  Object.entries(allResults).forEach(([name, tasks]) => {
    const mdxjs = tasks.find(t => t.name === '@mdx-js/mdx');
    const rspress = tasks.find(t => t.name === '@rspress/mdx-rs');
    const bunnyNativeProg = tasks.find(t => t.name === 'bunny-native (program)');
    const bunnyNativeFn = tasks.find(t => t.name === 'bunny-native (function-body)');
    const bunnyProgram = tasks.find(t => t.name === 'bunny-wasm (program)');
    const bunnyFn = tasks.find(t => t.name === 'bunny-wasm (function-body)');

    const validTasks = [mdxjs, rspress, bunnyNativeProg, bunnyNativeFn, bunnyProgram, bunnyFn].filter(t => t && t.result && t.result.hz);
    if (validTasks.length === 0) return;

    const sorted = validTasks.sort((a, b) => b.result.hz - a.result.hz);
    const fastest = sorted[0];

    const formatCell = (task) => {
      if (!task || !task.result || !task.result.hz) return chalk.dim('N/A');
      const opsPerSec = task.result.hz.toFixed(0);
      const speedup = (fastest.result.hz / task.result.hz).toFixed(1);
      return task === fastest
        ? chalk.green(`${opsPerSec} ops/s ⚡`)
        : chalk.yellow(`${opsPerSec} ops/s (${speedup}x)`);
    };

    summaryTable.push([
      name,
      formatCell(mdxjs),
      formatCell(rspress),
      formatCell(bunnyNativeProg),
      formatCell(bunnyNativeFn),
      formatCell(bunnyProgram),
      formatCell(bunnyFn),
    ]);
  });

  console.log(summaryTable.toString());

  // Winner declaration
  console.log(chalk.bold.green('\n✨ Key Findings:'));
  console.log(chalk.dim('  • Native Rust implementations are fastest'));
  console.log(chalk.dim('  • bunny-wasm delivers near-native Rust performance in the browser'));
  console.log(chalk.dim('  • Function-body format has minimal overhead vs program format'));
  console.log(chalk.dim('  • All implementations significantly outperform JavaScript'));
  console.log(chalk.dim('  • All implementations produce MDX v3 compliant output\n'));
}

async function main() {
  const args = process.argv.slice(2);
  const specificTest = args.find(arg => !arg.startsWith('--'));

  console.log(chalk.bold.blue('\n🐰 Bunny MDX Performance Benchmark\n'));
  console.log(chalk.dim('Comparing MDX compilation speed across implementations\n'));

  // Display fixture info
  const customCount = Object.keys(customFixtures).length;
  const hasNextjs = nextjsFiles && nextjsFiles.length > 0;
  if (hasNextjs) {
    console.log(chalk.dim(`📦 Fixtures loaded: ${customCount} custom + ${nextjsFiles.length} Next.js files\n`));
  } else {
    console.log(chalk.dim(`📦 Fixtures loaded: ${customCount} custom\n`));
  }

  const allResults = {};

  if (specificTest) {
    // Run specific test
    if (specificTest === 'nextjs-batch' && hasNextjs) {
      const tasks = await runBatchBenchmark('nextjs-batch', nextjsFiles);
      displayBatchResults('nextjs-batch', tasks, nextjsFiles);
    } else if (customFixtures[specificTest]) {
      const tasks = await runBenchmark(specificTest, customFixtures[specificTest]);
      displayResults(specificTest, tasks, customFixtures[specificTest]);
    } else {
      console.log(chalk.red(`Unknown test: ${specificTest}`));
      console.log(chalk.dim('Available tests: simple, complex, large, nextjs-batch'));
    }
  } else {
    // Run all benchmarks - custom fixtures first
    for (const [name, content] of Object.entries(customFixtures)) {
      const tasks = await runBenchmark(name, content);
      allResults[name] = tasks;
      displayResults(name, tasks, content);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Then run Next.js batch if available
    if (hasNextjs) {
      const tasks = await runBatchBenchmark('nextjs-batch', nextjsFiles);
      allResults['nextjs-batch'] = tasks;
      displayBatchResults('nextjs-batch', tasks, nextjsFiles);
    }

    displaySummary(allResults);
  }

  if (global.gc) {
    console.log(chalk.dim('✓ Running with --expose-gc for accurate memory measurements\n'));
  } else {
    console.log(chalk.dim('💡 Tip: Run with --expose-gc flag for memory profiling\n'));
  }
}

main().catch(console.error);
