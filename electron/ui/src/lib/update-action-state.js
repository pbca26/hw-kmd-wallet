const updateActionState = (context, action, value) => {
  context.setState(prevState => ({
    ...prevState,
    actions: {
      ...prevState.actions,
      [action]: {
        ...prevState.actions[action],
        state: value
      }
    }
  }));
};
export default updateActionState;
