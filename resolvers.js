import { GraphQLError } from 'graphql';
import { companyLoader, getCompany } from './db/companies.js';
import {
  createJob,
  deleteJob,
  getJob,
  getJobs,
  getJobsByCompanyId,
  updateJob,
} from './db/jobs.js';

export const resolvers = {
  Query: {
    job: async (_root, { id }) => {
      const job = await getJob(id);
      if (!job) throw notFoundError(`No Job Found with ID: '${id}'`);
      return job;
    },
    jobs: async () => {
      const jobs = await getJobs();
      return jobs;
    },
    company: async (_root, { id }) => {
      const company = await getCompany(id);
      if (!company) throw notFoundError(`No Company Found with ID: '${id}'`);
      return company;
    },
  },

  Mutation: {
    createJob: async (_root, { input: { title, description } }, { user }) => {
      if (!user) throw unauthorizedError(`Missing authentication`);
      const { companyId } = user;
      const job = await createJob({ companyId, title, description });
      return job;
    },
    updateJob: async (
      _root,
      { input: { id, title, description } },
      { user }
    ) => {
      if (!user) throw unauthorizedError('Missing authentication');
      const job = await updateJob({
        id,
        title,
        description,
        companyId: user.companyId,
      });
      if (!job) throw notFoundError(`No Job Found with ID: '${id}'`);
      return job;
    },
    deleteJob: async (_root, { input: { id } }, { user }) => {
      console.log('[deleteJob] user:', user);
      if (!user) throw unauthorizedError(`Missing authentication`);
      const job = await deleteJob(id, user.companyId);
      if (!job) throw notFoundError(`No Job Found with ID: '${id}'`);
      return job;
    },
  },

  Job: {
    date: (job) => toIsoDate(job.createdAt),
    company: (job) => companyLoader.load(job.companyId),
  },

  Company: {
    jobs: (company) => getJobsByCompanyId(company.id),
  },
};

const toIsoDate = (value) => {
  return value.slice(0, 'yyyy-mm-dd'.length);
};

const notFoundError = (message) => {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
};

const unauthorizedError = (message) => {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHORIZED' },
  });
};
