import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyResumeExperience } from './resumeParser';

test('classifies fresher resumes without counting internships as work experience', () => {
  const result = classifyResumeExperience(`
    Name: Asha Kumar
    Education: B.Tech in Computer Science
    Certifications: AWS Cloud Practitioner
    Projects: College project on React and Node.js
    Internship: Software Engineering Intern at TechNova (Jun 2024 - Aug 2024)
    Training: Full stack development bootcamp
  `);

  assert.equal(result.employmentType, 'Fresher');
  assert.equal(result.experienceYears, 0);
  assert.equal(result.experienceMonths, 0);
  assert.equal(result.workExperience.length, 0);
  assert.equal(result.internships.length, 2);
});

test('counts only full-time work for experienced candidates', () => {
  const result = classifyResumeExperience(`
    Name: John Doe
    Experience:
    Software Engineer at Acme Corp (Jan 2022 - Present)
    Software Engineering Intern at Beta Labs (Jun 2021 - Aug 2021)
    Training: React bootcamp
  `);

  assert.equal(result.employmentType, 'Experienced');
  assert.ok(result.experienceYears >= 4);
  assert.ok(result.experienceMonths >= 0);
  assert.equal(result.workExperience.length, 1);
  assert.equal(result.internships.length, 1);
});
