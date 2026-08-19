import type { PageParams, PageResult } from "../types/api";
import type { Customer, CustomerQuery } from "../types/customer";
import { paginateMockData } from "../utils/mock";
import { createOperationLog, mockDb, nextCustomerId, nowText } from "./mockDb";
import { mockError, mockRequest } from "./request";

//客户列表查询参数：分页参数 + 客户业务筛选条件
export interface CustomerListParams extends PageParams, CustomerQuery {}

//新增客户入参：前端不传 id 和 createdAt，这两个字段由Mock后端生成
export type CreateCustomerPayload = Omit<Customer, "id" | "createdAt">;

//编辑客户入参：允许局部更新，表单只提交变化字段也可以
export type UpdateCustomerPayload = Partial<
  Omit<Customer, "id" | "createdAt">
>;

//客户分页查询接口：用于客户管理列表页
export function getCustomers(params: CustomerListParams) {
  const { page, pageSize, keyword, creditLevel, status } = params;
  //统一小写后再匹配，避免大小写影响搜索结果
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const filtered = mockDb.customers.filter((customer) => {
    //keyword 支持姓名、手机号、身份证、支行、客户经理的模糊搜索
    const matchKeyword =
      !normalizedKeyword ||
      [
        customer.name,
        customer.phone,
        customer.idCard,
        customer.branch,
        customer.accountManager,
      ].some((value) => value.toLowerCase().includes(normalizedKeyword));
    //信用等级筛选，例如只看 A 级客户
    const matchCreditLevel =
      !creditLevel || customer.creditLevel === creditLevel;
    //客户状态筛选，例如正常、观察、冻结
    const matchStatus = !status || customer.status === status;

    return matchKeyword && matchCreditLevel && matchStatus;
  });

  //先筛选再分页，和真实后端的分页查询语义保持一致
  return mockRequest<PageResult<Customer>>(
    paginateMockData(filtered, page, pageSize),
  );
}

//客户详情接口：用于客户详情页、贷款申请创建时回显客户信息
export function getCustomerById(id: number) {
  const customer = mockDb.customers.find((item) => item.id === id);

  if (!customer) {
    return mockError<Customer>(404, "客户不存在");
  }

  return mockRequest<Customer>(customer);
}

//新增客户接口：用于客户管理页的新增表单
export function createCustomer(payload: CreateCustomerPayload) {
  //Mock后端补齐主键和创建时间
  const customer: Customer = {
    ...payload,
    id: nextCustomerId(),
    createdAt: nowText(),
  };

  //新客户放在列表最前面，新增成功后用户能立刻看到
  mockDb.customers.unshift(customer);
  //银行后台关键操作需要留痕，这里模拟新增客户操作日志
  createOperationLog({
    operatorId: 3,
    operatorName: "运营人员",
    role: "operator",
    module: "customer",
    action: "新增客户",
    targetId: customer.id,
    targetName: customer.name,
    result: "success",
  });

  return mockRequest<Customer>(customer);
}

//编辑客户接口：用于客户资料维护，支持局部字段更新
export function updateCustomer(id: number, payload: UpdateCustomerPayload) {
  const customer = mockDb.customers.find((item) => item.id === id);

  if (!customer) {
    return mockError<Customer>(404, "客户不存在");
  }

  //直接合并字段，模拟后端 patch/update 逻辑
  Object.assign(customer, payload);
  //编辑客户属于关键业务操作，也写入审计日志
  createOperationLog({
    operatorId: 3,
    operatorName: "运营人员",
    role: "operator",
    module: "customer",
    action: "编辑客户",
    targetId: customer.id,
    targetName: customer.name,
    result: "success",
  });

  return mockRequest<Customer>(customer);
}
