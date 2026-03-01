/**
 * 任务管理验证服务
 */

import { 
  CreateTaskInput, 
  UpdateTaskInput, 
  TaskFilter,
  ValidationResult,
  ValidationError
} from '../types';

export class ValidationService {
  validateCreateTask(input: CreateTaskInput): ValidationResult<CreateTaskInput> {
    const errors: ValidationError[] = [];

    if (!input.title || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: '任务标题不能为空', code: 'REQUIRED' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: '任务标题不能超过200个字符', code: 'MAX_LENGTH', value: input.title.length });
    }

    if (input.description && input.description.length > 5000) {
      errors.push({ field: 'description', message: '描述不能超过5000个字符', code: 'MAX_LENGTH' });
    }

    if (input.estimatedHours !== undefined && input.estimatedHours < 0) {
      errors.push({ field: 'estimatedHours', message: '预估时间不能为负数', code: 'MIN_VALUE' });
    }

    if (input.dueDate) {
      const due = new Date(input.dueDate);
      if (isNaN(due.getTime())) {
        errors.push({ field: 'dueDate', message: '截止日期格式无效', code: 'INVALID_FORMAT' });
      }
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? input : undefined,
      errors,
      warnings: []
    };
  }

  validateUpdateTask(input: UpdateTaskInput): ValidationResult<UpdateTaskInput> {
    const errors: ValidationError[] = [];

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        errors.push({ field: 'title', message: '任务标题不能为空', code: 'REQUIRED' });
      } else if (input.title.length > 200) {
        errors.push({ field: 'title', message: '任务标题不能超过200个字符', code: 'MAX_LENGTH' });
      }
    }

    if (input.estimatedHours !== undefined && input.estimatedHours < 0) {
      errors.push({ field: 'estimatedHours', message: '预估时间不能为负数', code: 'MIN_VALUE' });
    }

    if (input.actualHours !== undefined && input.actualHours < 0) {
      errors.push({ field: 'actualHours', message: '实际时间不能为负数', code: 'MIN_VALUE' });
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? input : undefined,
      errors,
      warnings: []
    };
  }

  validateTaskFilter(filter: TaskFilter): ValidationResult<TaskFilter> {
    const errors: ValidationError[] = [];

    if (filter.page !== undefined && filter.page < 1) {
      errors.push({ field: 'page', message: '页码必须大于0', code: 'MIN_VALUE' });
    }

    if (filter.limit !== undefined && (filter.limit < 1 || filter.limit > 100)) {
      errors.push({ field: 'limit', message: '每页数量必须在1-100之间', code: 'RANGE_ERROR' });
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? filter : undefined,
      errors,
      warnings: []
    };
  }
}