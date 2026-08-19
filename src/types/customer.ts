//客户数据类型

//客户信用评级
export type CreditLevel = "A" | "B" | "C" | "D";

//限定了客户的账户状态
export type CustomerStatus = "normal" | "watch" | "frozen";

//客户实体模型
export interface Customer {
  id: number; //客户唯一标识
  name: string; //客户姓名
  phone: string; //手机号码
  idCard: string; //身份证号码
  age: number; //年龄
  job: string; //职业/行业
  monthlyIncome: number; //月收入
  creditLevel: CreditLevel; //信用等级
  riskTags: string[]; //风险标签列表
  branch: string; //所属分行/网点
  accountManager: string; //客户经理
  status: CustomerStatus; //账户当前状态
  createdAt: string; //建档时间
}

//客户查询条件
export interface CustomerQuery {
  keyword?: string; //通用的关键词搜索
  creditLevel?: CreditLevel; //按信用等级筛选
  status?: CustomerStatus; //按客户状态筛选
}
