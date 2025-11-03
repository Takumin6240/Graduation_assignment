const pool = require('../config/database');
const { log } = require('../utils/logger');
const JSZip = require('jszip');
const { evaluateScratchProgram } = require('../services/scratchGradingEngine');

// Parse SB3 file (Scratch file is a ZIP containing project.json)
const parseSB3File = async (fileBuffer) => {
  try {
    const zip = await JSZip.loadAsync(fileBuffer);
    const projectJsonFile = zip.file('project.json');

    if (!projectJsonFile) {
      throw new Error('Invalid SB3 file: project.json not found');
    }

    const projectJson = await projectJsonFile.async('string');
    return JSON.parse(projectJson);
  } catch (error) {
    throw new Error('SB3ファイルの解析に失敗しました');
  }
};

// Extract all blocks from Scratch data
const extractBlocks = (data) => {
  if (!data || !data.targets) return [];

  const allBlocks = [];
  for (const target of data.targets) {
    if (target.blocks) {
      for (const [blockId, block] of Object.entries(target.blocks)) {
        allBlocks.push({ id: blockId, ...block });
      }
    }
  }
  return allBlocks;
};

// Get block sequence starting from a top-level block
const getBlockSequence = (blocks, startBlockId) => {
  const sequence = [];
  let currentBlockId = startBlockId;
  const blockMap = {};

  blocks.forEach(block => {
    blockMap[block.id] = block;
  });

  while (currentBlockId) {
    const block = blockMap[currentBlockId];
    if (!block) break;

    sequence.push({
      opcode: block.opcode,
      inputs: block.inputs,
      fields: block.fields
    });

    currentBlockId = block.next;
  }

  return sequence;
};

// Compare two block sequences
const compareBlockSequences = (seq1, seq2) => {
  if (seq1.length !== seq2.length) {
    return seq1.length === 0 ? 0 : Math.min(seq1.length, seq2.length) / Math.max(seq1.length, seq2.length);
  }

  let matches = 0;
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i].opcode === seq2[i].opcode) {
      matches++;

      // Check input values for critical blocks
      if (seq1[i].inputs && seq2[i].inputs) {
        const inputs1 = JSON.stringify(seq1[i].inputs);
        const inputs2 = JSON.stringify(seq2[i].inputs);
        if (inputs1 === inputs2) {
          matches += 0.5; // Bonus for matching inputs
        }
      }
    }
  }

  return matches / (seq1.length * 1.5); // Account for bonus points
};

// Check if specific block types exist
const hasBlockType = (blocks, opcode) => {
  return blocks.some(block => block.opcode === opcode);
};

// Count blocks of a specific type
const countBlockType = (blocks, opcode) => {
  return blocks.filter(block => block.opcode === opcode).length;
};

// Get input value from a block
const getInputValue = (block, inputName) => {
  if (!block || !block.inputs || !block.inputs[inputName]) return null;

  const input = block.inputs[inputName];
  if (input.shadow && input.shadow.value !== undefined) {
    return input.shadow.value;
  }
  return null;
};

// Deep equality comparison that ignores property order
const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  if (keys1.length !== keys2.length) return false;
  if (keys1.join(',') !== keys2.join(',')) return false;

  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

// Advanced comparison logic for Scratch programs (v2.0 - 新しい採点エンジン使用)
const compareScratchPrograms = (submittedData, correctData, problemType = null) => {
  if (!submittedData || !correctData) {
    return { isCorrect: false, score: 0, message: 'データが不正です', feedback: 'データが不正です' };
  }

  // 新しい採点エンジンを使用
  const result = evaluateScratchProgram(submittedData, correctData);

  // フィードバックを文字列形式に変換
  let feedbackText = result.feedback.summary;

  if (result.feedback.details && result.feedback.details.length > 0) {
    feedbackText += '\n\n【詳細】\n';
    for (const detail of result.feedback.details) {
      feedbackText += `${detail.icon} ${detail.message}\n`;
    }
  }

  if (result.feedback.hints && result.feedback.hints.length > 0) {
    feedbackText += '\n【ヒント】\n';
    for (const hint of result.feedback.hints) {
      feedbackText += `💡 ${hint}\n`;
    }
  }

  return {
    isCorrect: result.isCorrect,
    score: result.score,
    message: result.isCorrect ? '正解です！' : '不正解です',
    feedback: feedbackText,
    feedbackData: result.feedback  // 構造化されたフィードバック（フロントエンド用）
  };
};

// Legacy comparison logic for Scratch programs (旧バージョン - 参考用に残す)
const compareScratchProgramsLegacy = (submittedData, correctData, problemType = null) => {
  if (!submittedData || !correctData) {
    return { isCorrect: false, score: 0, message: 'データが不正です' };
  }

  // First, try to check for semantic equivalence by comparing block structures
  // Build a semantic representation of the program (opcode sequence and values)
  const buildSemanticRepresentation = (data) => {
    if (!data || !data.targets) return [];

    const representations = [];
    for (const target of data.targets) {
      if (!target.blocks || target.isStage) continue; // Skip stage

      const blocks = Object.values(target.blocks);

      // Find all top-level blocks (script starting points)
      const topLevelBlocks = blocks.filter(b => b.topLevel);

      for (const topBlock of topLevelBlocks) {
        const sequence = [];
        let current = topBlock;
        const blockMap = {};

        blocks.forEach(b => {
          // Find the actual ID (the key in the blocks object)
          const entry = Object.entries(target.blocks).find(([id, block]) => block === b);
          if (entry) blockMap[entry[0]] = b;
        });

        // Traverse the block chain
        const visited = new Set();
        const blockById = Object.fromEntries(Object.entries(target.blocks));

        const traverse = (blockId) => {
          if (!blockId || visited.has(blockId)) return;
          visited.add(blockId);

          const block = blockById[blockId];
          if (!block) return;

          sequence.push({
            opcode: block.opcode,
            inputs: block.inputs,
            fields: block.fields
          });

          // Follow the next block
          if (block.next) traverse(block.next);

          // Follow substacks (for control blocks like repeat)
          if (block.inputs) {
            for (const [key, value] of Object.entries(block.inputs)) {
              if (value && typeof value === 'object' && value.block) {
                traverse(value.block);
              }
            }
          }
        };

        const startId = Object.entries(target.blocks).find(([id, b]) => b === topBlock)?.[0];
        if (startId) traverse(startId);

        representations.push(sequence);
      }
    }

    return representations;
  };

  const submittedRep = buildSemanticRepresentation(submittedData);
  const correctRep = buildSemanticRepresentation(correctData);

  // Debug logging
  console.log('=== Scratch Comparison Debug ===');
  console.log('Submitted representation:', JSON.stringify(submittedRep, null, 2));
  console.log('Correct representation:', JSON.stringify(correctRep, null, 2));
  console.log('Deep equal?', deepEqual(submittedRep, correctRep));
  console.log('================================');

  // Check for exact semantic match using deep equality
  if (deepEqual(submittedRep, correctRep)) {
    return {
      isCorrect: true,
      score: 100,
      message: '正解です！',
      feedback: '✓ プログラムが正解と完全に一致しています'
    };
  }

  // Extract blocks from both programs
  const submittedBlocks = extractBlocks(submittedData);
  const correctBlocks = extractBlocks(correctData);

  // Quick check: if submitted has no blocks
  if (submittedBlocks.length === 0) {
    return { isCorrect: false, score: 0, message: 'プログラムが空です。ブロックを追加してください。' };
  }

  // Get top-level blocks (blocks with topLevel: true)
  const submittedTopBlocks = submittedBlocks.filter(b => b.topLevel);
  const correctTopBlocks = correctBlocks.filter(b => b.topLevel);

  let totalScore = 0;
  let maxScore = 100;
  let feedback = [];

  // 1. Check for event blocks (green flag, etc.)
  const hasEventBlock = hasBlockType(submittedBlocks, 'event_whenflagclicked');
  const shouldHaveEventBlock = hasBlockType(correctBlocks, 'event_whenflagclicked');

  if (shouldHaveEventBlock) {
    if (hasEventBlock) {
      totalScore += 10;
      feedback.push('✓ イベントブロックがあります');
    } else {
      feedback.push('✗ 緑の旗がクリックされたときのブロックが必要です');
    }
  }

  // 2. Compare block sequences
  if (submittedTopBlocks.length > 0 && correctTopBlocks.length > 0) {
    const submittedSeq = getBlockSequence(submittedBlocks, submittedTopBlocks[0].id);
    const correctSeq = getBlockSequence(correctBlocks, correctTopBlocks[0].id);

    const sequenceSimilarity = compareBlockSequences(submittedSeq, correctSeq);
    const sequenceScore = Math.round(sequenceSimilarity * 50);
    totalScore += sequenceScore;

    if (sequenceSimilarity >= 0.9) {
      feedback.push('✓ ブロックの順序が正しいです');
    } else if (sequenceSimilarity >= 0.5) {
      feedback.push('△ ブロックの順序がだいたい合っています');
    } else {
      feedback.push('✗ ブロックの順序を確認してください');
    }
  }

  // 3. Check for specific block types that should exist
  const requiredBlockTypes = [
    'motion_movesteps',
    'motion_turnright',
    'control_repeat',
    'control_forever',
    'looks_say',
    'pen_penDown'
  ];

  for (const blockType of requiredBlockTypes) {
    const correctCount = countBlockType(correctBlocks, blockType);
    const submittedCount = countBlockType(submittedBlocks, blockType);

    if (correctCount > 0) {
      if (submittedCount === correctCount) {
        totalScore += 10;
      } else if (submittedCount > 0) {
        totalScore += 5;
      }
    }
  }

  // 4. Check critical input values (e.g., number of steps, repeat times)
  for (const correctBlock of correctBlocks) {
    const matchingSubmitted = submittedBlocks.find(sb => sb.opcode === correctBlock.opcode);

    if (matchingSubmitted && correctBlock.inputs) {
      for (const [inputName, inputValue] of Object.entries(correctBlock.inputs)) {
        const correctVal = getInputValue(correctBlock, inputName);
        const submittedVal = getInputValue(matchingSubmitted, inputName);

        if (correctVal !== null && submittedVal !== null) {
          if (correctVal.toString() === submittedVal.toString()) {
            totalScore += 5;
          }
        }
      }
    }
  }

  // Cap the score at 100
  totalScore = Math.min(totalScore, 100);

  // Determine if correct based on score
  const isCorrect = totalScore >= 80;

  return {
    isCorrect,
    score: totalScore,
    message: isCorrect ? '正解です！' : '不正解です',
    feedback: feedback.join('\n')
  };
};

// Calculate similarity between two Scratch programs (legacy fallback)
const calculateSimilarity = (data1, data2) => {
  try {
    const blocks1 = data1.targets?.[0]?.blocks || {};
    const blocks2 = data2.targets?.[0]?.blocks || {};

    const keys1 = Object.keys(blocks1);
    const keys2 = Object.keys(blocks2);

    if (keys1.length === 0 && keys2.length === 0) return 1;
    if (keys1.length === 0 || keys2.length === 0) return 0;

    const matchingBlocks = keys1.filter(key => blocks2[key]).length;
    return matchingBlocks / Math.max(keys1.length, keys2.length);
  } catch (error) {
    return 0;
  }
};

// Calculate EXP based on difficulty and performance
const calculateEarnedExp = (difficulty, score, attemptNumber, isPerfect) => {
  // Base EXP by difficulty (1-5) - 調整済み：より緩やかなレベルアップ
  const baseExpByDifficulty = {
    1: 40,   // 50 → 40
    2: 60,   // 80 → 60
    3: 80,   // 120 → 80
    4: 100,  // 150 → 100
    5: 130   // 200 → 130
  };

  let baseExp = baseExpByDifficulty[difficulty] || 40;
  let bonusExp = 0;

  // Perfect score bonus - 調整済み
  if (isPerfect) {
    bonusExp += 15;  // 20 → 15
  }

  // First-try bonus - 調整済み
  if (attemptNumber === 1) {
    bonusExp += 20;  // 30 → 20
  } else if (attemptNumber === 2) {
    bonusExp += 10;  // 15 → 10
  } else {
    bonusExp += 5;   // 10 → 5
  }

  // Score multiplier (proportional to score)
  const scoreMultiplier = score / 100;
  const earnedExp = Math.floor(baseExp * scoreMultiplier + bonusExp);

  return {
    earnedExp,
    bonusExp,
    baseExp: Math.floor(baseExp * scoreMultiplier)
  };
};

// Get total points required to reach a specific rank
const getPointsForRank = (rank) => {
  // ランク1は0ポイントから開始
  if (rank <= 1) return 0;

  // ランクnに到達するのに必要な累積ポイント
  // ランク1→2: 100ポイント
  // ランク2→3: 150ポイント
  // ランク3→4: 200ポイント
  // ランク4→5: 250ポイント
  // パターン: 各ランクアップに必要なポイント = 50 + 50 * (ランク - 1)
  let totalPoints = 0;
  for (let i = 1; i < rank; i++) {
    totalPoints += 50 + 50 * i; // 100, 150, 200, 250, 300, ...
  }
  return totalPoints;
};

// Calculate rank up
const calculateRankUp = (currentPoints, currentRank) => {
  let newRank = currentRank;

  // 次のランクに到達できるかチェック
  while (currentPoints >= getPointsForRank(newRank + 1)) {
    newRank++;
  }

  // 現在のランクに到達するために必要だった累積ポイント
  const pointsForCurrentRank = getPointsForRank(newRank);

  // 現在のランク内で獲得したポイント（0以上である必要がある）
  const currentRankPoints = currentPoints - pointsForCurrentRank;

  // 次のランクに到達するために必要な累積ポイント
  const pointsForNextRankTotal = getPointsForRank(newRank + 1);

  // このランクから次のランクまでに必要なポイント
  const pointsForNextRank = pointsForNextRankTotal - pointsForCurrentRank;

  // あと何ポイント必要か
  const pointsToNextRank = pointsForNextRank - currentRankPoints;

  return {
    newRank,
    rankedUp: newRank > currentRank,
    pointsToNextRank,
    currentRankPoints,
    pointsForNextRank
  };
};

// Submit solution
const submitSolution = async (req, res) => {
  const { problemId } = req.params;
  const userId = req.user.userId;
  const { hintUsageCount = 0, timeSpent = 0, answerX, answerY } = req.body;

  try {
    // Get problem data first to check problem type
    const problemResult = await pool.query(
      'SELECT problem_type, correct_sb3_data, correct_answer_x, correct_answer_y, max_score, difficulty_level FROM problems WHERE id = $1',
      [problemId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: '問題が見つかりません' });
    }

    const problem = problemResult.rows[0];
    let submittedData = null;
    let isCorrect = false;
    let score = 0;
    let message = '';

    // Handle predict problems differently
    if (problem.problem_type === 'predict') {
      // Check if coordinates were provided
      if (answerX === undefined || answerY === undefined) {
        return res.status(400).json({ error: 'X座標とY座標を入力してください' });
      }

      const submittedX = parseInt(answerX);
      const submittedY = parseInt(answerY);

      if (isNaN(submittedX) || isNaN(submittedY)) {
        return res.status(400).json({ error: '座標は数値で入力してください' });
      }

      // Compare with correct answer
      const correctX = problem.correct_answer_x;
      const correctY = problem.correct_answer_y;

      if (correctX === null || correctY === null) {
        return res.status(500).json({ error: 'この問題の正解が設定されていません' });
      }

      const xMatch = submittedX === correctX;
      const yMatch = submittedY === correctY;

      if (xMatch && yMatch) {
        isCorrect = true;
        score = 100;
        message = '正解です！';
      } else if (xMatch || yMatch) {
        isCorrect = false;
        score = 50;
        message = '不正解です';
      } else {
        isCorrect = false;
        score = 0;
        message = '不正解です';
      }

      // Store answer as JSON for tracking
      submittedData = { answerX: submittedX, answerY: submittedY };
    } else {
      // Handle other problem types (SB3 file upload)
      if (!req.file) {
        return res.status(400).json({ error: 'SB3ファイルをアップロードしてください' });
      }

      // Parse submitted SB3 file
      submittedData = await parseSB3File(req.file.buffer);

      // Compare submitted solution with correct answer
      const result = compareScratchPrograms(
        submittedData,
        problem.correct_sb3_data
      );
      isCorrect = result.isCorrect;
      score = result.score;
      message = result.message;
    }

    // Get current attempt number
    const attemptResult = await pool.query(
      'SELECT COUNT(*) as count FROM submission_attempts WHERE user_id = $1 AND problem_id = $2',
      [userId, problemId]
    );
    const attemptNumber = parseInt(attemptResult.rows[0].count) + 1;

    // Get feedback message for this attempt
    let feedbackMessage = message;
    if (problem.problem_type !== 'predict' && !isCorrect) {
      // For SB3 problems, include detailed feedback
      const result = compareScratchPrograms(submittedData, problem.correct_sb3_data);
      feedbackMessage = result.feedback || message;
    }

    // Record attempt with error_message (feedback for incorrect attempts)
    await pool.query(
      `INSERT INTO submission_attempts
       (user_id, problem_id, attempt_number, attempted_sb3_data, is_correct_attempt, error_message, hint_viewed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, problemId, attemptNumber, submittedData, isCorrect, isCorrect ? null : feedbackMessage, hintUsageCount > 0]
    );

    // Calculate points and rank
    let pointsData = null;

    // Get user's current rank and points
    const userResult = await pool.query(
      'SELECT rank, points FROM users WHERE id = $1',
      [userId]
    );
    const currentUser = userResult.rows[0];

    // Always update/insert submission (for both correct and incorrect)
    await pool.query(
      `INSERT INTO submissions
       (user_id, problem_id, is_correct, score, total_attempts, hint_usage_count, time_spent, final_sb3_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, problem_id)
       DO UPDATE SET
         is_correct = CASE WHEN $3 = true THEN true ELSE submissions.is_correct END,
         score = GREATEST(submissions.score, $4),
         total_attempts = submissions.total_attempts + 1,
         hint_usage_count = $6,
         time_spent = $7,
         final_sb3_data = $8,
         completed_at = CURRENT_TIMESTAMP`,
      [userId, problemId, isCorrect, score, attemptNumber, hintUsageCount, timeSpent, submittedData]
    );

    // If correct, calculate and award points
    if (isCorrect) {
      const difficulty = problem.difficulty_level || 1;
      const isPerfect = score === 100;

      // Calculate earned points (using same calculation as before)
      const pointsCalc = calculateEarnedExp(difficulty, score, attemptNumber, isPerfect);
      const newTotalPoints = currentUser.points + pointsCalc.earnedExp;

      // Calculate rank up
      const rankData = calculateRankUp(newTotalPoints, currentUser.rank);

      // Update user points and rank
      await pool.query(
        'UPDATE users SET points = $1, rank = $2 WHERE id = $3',
        [newTotalPoints, rankData.newRank, userId]
      );

      // Prepare points data for response
      pointsData = {
        earnedPoints: pointsCalc.earnedExp,
        basePoints: pointsCalc.baseExp,
        bonusPoints: pointsCalc.bonusExp,
        totalPoints: newTotalPoints,
        previousRank: currentUser.rank,
        newRank: rankData.newRank,
        rankedUp: rankData.rankedUp,
        pointsToNextRank: rankData.pointsToNextRank,
        currentRankPoints: rankData.currentRankPoints
      };

      log(`User ${userId} solved problem ${problemId} (Score: ${score}, Earned: ${pointsCalc.earnedExp} Points, Rank: ${rankData.newRank})`);
    } else {
      log(`User ${userId} attempted problem ${problemId} (Score: ${score}, Incorrect)`);
    }

    // フィードバックデータを取得（新しい採点エンジンから）
    let feedbackData = null;
    if (problem.problem_type !== 'predict' && submittedData) {
      const result = compareScratchPrograms(submittedData, problem.correct_sb3_data);
      feedbackData = result.feedbackData;
    }

    res.json({
      isCorrect,
      score,
      message,
      attemptNumber,
      totalAttempts: attemptNumber,
      pointsData,
      feedback: feedbackData  // 構造化されたフィードバック
    });
  } catch (error) {
    log(`Submit solution error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: error.message || 'サーバーエラーが発生しました' });
  }
};

// Get submission history
const getSubmissionHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT s.*, p.title, p.problem_type, c.title as chapter_title
       FROM submissions s
       JOIN problems p ON s.problem_id = p.id
       JOIN chapters c ON p.chapter_id = c.id
       WHERE s.user_id = $1
       ORDER BY s.completed_at DESC`,
      [userId]
    );

    res.json({ submissions: result.rows });
  } catch (error) {
    log(`Get submission history error: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  submitSolution,
  getSubmissionHistory
};
