// Test script to verify ranking functionality
import { rankCandidatesForJob } from './lib/server/candidateRanking';

async function testRanking() {
  const mockJob = {
    $id: 'test-job-1',
    title: 'Senior Frontend Developer',
    description: 'Looking for an experienced frontend developer with React and TypeScript skills',
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML'],
    min_experience: 3,
    max_experience: 8
  };

  const mockCandidates = [
    {
      $id: 'candidate-1',
      title: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'JavaScript'],
      total_experience: 4,
      relevant_experience: 3,
      summary: 'Experienced frontend developer with React expertise'
    },
    {
      $id: 'candidate-2', 
      title: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'Python'],
      total_experience: 5,
      relevant_experience: 2,
      summary: 'Full stack developer with some frontend experience'
    },
    {
      $id: 'candidate-3',
      title: 'Junior Developer',
      skills: ['JavaScript', 'HTML', 'CSS'],
      total_experience: 2,
      relevant_experience: 1,
      summary: 'Junior developer looking to grow'
    }
  ];

  try {
    console.log('🧪 Testing candidate ranking...');
    const results = await rankCandidatesForJob(mockJob, mockCandidates);
    console.log('✅ Ranking completed successfully!');
    console.log('Results:', results.map(r => `${r.$id}: ${r.matchScore}% (${r.scoreMethod})`));
  } catch (error) {
    console.error('❌ Ranking test failed:', error);
  }
}

// Uncomment to run test
// testRanking();
