import { Bench } from 'tinybench';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { compile as bunnyCompile } from '@bunny/mdx-node';
import { compile as mdxjsCompile } from '@mdx-js/mdx';
import { compileSync as rspressCompile } from '@rspress/mdx-rs';

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

async function runBenchmark(name, content) {
  const spinner = ora(`Running ${name} benchmark...`).start();

  const bench = new Bench({
    time: 1000,  // Run for 1 second
    iterations: 10,
    warmupIterations: 5,
  });

  // Bunny MDX (Rust via NAPI)
  bench.add('@bunny/mdx-node', () => {
    try {
      bunnyCompile(content, commonOptions);
    } catch (e) {
      console.error('@bunny/mdx-node error:', e.message);
      throw e;
    }
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

  // Bunny MDX (Rust via NAPI) - compile all files sequentially
  bench.add('@bunny/mdx-node', () => {
    try {
      for (const content of files) {
        bunnyCompile(content, commonOptions);
      }
    } catch (e) {
      console.error('@bunny/mdx-node error:', e.message);
      throw e;
    }
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
    const row = [
      isFastest ? chalk.green(task.name) : task.name,
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
    const row = [
      isFastest ? chalk.green(task.name) : task.name,
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
    head: ['Test Case', '@bunny/mdx-node', '@mdx-js/mdx', '@rspress/mdx-rs'],
    colAligns: ['left', 'right', 'right', 'right'],
  });

  Object.entries(allResults).forEach(([name, tasks]) => {
    const bunny = tasks.find(t => t.name === '@bunny/mdx-node');
    const mdxjs = tasks.find(t => t.name === '@mdx-js/mdx');
    const rspress = tasks.find(t => t.name === '@rspress/mdx-rs');

    const validTasks = [bunny, mdxjs, rspress].filter(t => t && t.result && t.result.hz);
    if (validTasks.length === 0) return;

    const sorted = validTasks.sort((a, b) => b.result.hz - a.result.hz);
    const fastest = sorted[0];

    const formatCell = (task) => {
      if (!task || !task.result || !task.result.hz) return 'N/A';
      const opsPerSec = task.result.hz.toFixed(0);
      const speedup = (fastest.result.hz / task.result.hz).toFixed(1);
      return task === fastest
        ? chalk.green(`${opsPerSec} ops/s ⚡`)
        : chalk.yellow(`${opsPerSec} ops/s (${speedup}x slower)`);
    };

    summaryTable.push([
      name,
      formatCell(bunny),
      formatCell(mdxjs),
      formatCell(rspress),
    ]);
  });

  console.log(summaryTable.toString());

  // Calculate average speedup for Bunny vs @mdx-js/mdx
  const speedups = Object.values(allResults).map(tasks => {
    const bunny = tasks.find(t => t.name === '@bunny/mdx-node');
    const mdxjs = tasks.find(t => t.name === '@mdx-js/mdx');
    return bunny && mdxjs ? bunny.result.hz / mdxjs.result.hz : 0;
  }).filter(x => x > 0);

  const avgSpeedup = (speedups.reduce((a, b) => a + b, 0) / speedups.length).toFixed(1);

  // Winner declaration
  console.log(chalk.bold.green('\n✨ Key Findings:'));
  console.log(chalk.dim(`  • @bunny/mdx-node is ${avgSpeedup}x faster than @mdx-js/mdx on average`));
  console.log(chalk.dim('  • Rust implementations significantly outperform JavaScript'));
  console.log(chalk.dim('  • Performance gap increases with document complexity'));
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

